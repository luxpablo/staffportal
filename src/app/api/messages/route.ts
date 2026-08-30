// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireChannelAccess } from "@/lib/channelAuth";
import { rateLimit } from "@/lib/rateLimit";

// GET /api/messages?channelId=xxx&cursor=xxx&limit=50&search=foo&before=&after=
export async function GET(req:NextRequest){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");
    if(!channelId) return NextResponse.json({ error:"channelId required" }, {status:400});
    await requireChannelAccess(user, channelId);

    const limit = Math.min(parseInt(searchParams.get("limit")||"50"),100);
    const cursor = searchParams.get("cursor");
    const search = searchParams.get("search")||"";
    const before = searchParams.get("before");
    const after = searchParams.get("after");

    const where:any={ channelId, deletedAt:null };
    if(search) where.content={ contains:search, mode:"insensitive" };
    if(before) where.createdAt={ lt: new Date(before) };
    if(after) where.createdAt={ gt: new Date(after) };

    const messages = await prisma.message.findMany({
      where,
      include:{
        author:{select:{id:true,name:true,avatar:true}},
        replyTo:{select:{id:true,content:true,author:{select:{name:true}}}},
        reactions:{include:{user:{select:{name:true}}}},
        attachments:true,
        _count:{select:{replies:true}}
      },
      orderBy:{ createdAt:"desc" },
      take: limit,
      ...(cursor ? { cursor:{ id: cursor }, skip:1 } : {}),
    });

    // Reverse to show oldest first
    const reversed = messages.reverse();
    const nextCursor = messages.length===limit ? reversed[reversed.length-1]?.id : null;
    const hasMore = messages.length===limit;

    return NextResponse.json({ data: reversed, nextCursor, hasMore });
  }catch(e:any){
    if(e.message?.includes("Forbidden")) return NextResponse.json({ error:e.message }, {status:403});
    if(/Authentication failed|Can't reach|P1001/i.test(e.message)){
      return NextResponse.json({ data:[], nextCursor:null, hasMore:false, _warning:"Database unreachable" });
    }
    return NextResponse.json({ error:e.message }, {status:500});
  }
}

export async function POST(req:NextRequest){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const body = await req.json();
    const { channelId, content, type, replyToId, attachments } = body;
    if(!channelId || !content?.trim()) return NextResponse.json({ error:"channelId and content required" }, {status:400});
    await requireChannelAccess(user, channelId);
    const rl = await rateLimit(`msg:${user.id}`, 20, 60);
    if(!rl.allowed) return NextResponse.json({ error:"Rate limited: too many messages" }, {status:429});

    // Handle mentions: @username and @channel
    const mentionRegex = /@(\w+)/g;
    const mentions = [...content.matchAll(mentionRegex)].map(m=> m[1]);

    const message = await prisma.message.create({
      data:{
        channelId,
        authorId: user.id,
        content: content.trim(),
        type: type||"TEXT",
        replyToId: replyToId||null,
      },
      include:{ author:{select:{name:true,avatar:true}}, reactions:true }
    });

    // Handle file attachments
    if(Array.isArray(attachments)){
      for(const att of attachments){
        try{
          await prisma.messageAttachment.create({
            data:{ messageId: message.id, fileName: att.fileName, fileUrl: att.fileUrl, fileSize: att.fileSize||0, mimeType: att.mimeType||"application/octet-stream" }
          });
        }catch{}
      }
    }

    // Create notifications for mentions
    if(mentions.length){
      for(const username of mentions){
        try{
          const mentioned = await prisma.user.findUnique({ where:{ username }});
          if(mentioned && mentioned.id!==user.id){
            // Check if mentioned user can access channel
            const can = await prisma.channelMember.findUnique({ where:{ channelId_userId:{ channelId, userId: mentioned.id } }});
            // For @channel, notify all members
            if(username==="channel"){
              const members = await prisma.channelMember.findMany({ where:{ channelId }});
              for(const m of members){
                if(m.userId===user.id) continue;
                await prisma.notification.create({ data:{ userId: m.userId, title:`${user.name} mentioned @channel in #${channelId}`, message: content.slice(0,100), type:"mention", link:`/channels/${channelId}` }});
              }
            } else if(can || username==="channel"){
              await prisma.notification.create({ data:{ userId: mentioned.id, title:`${user.name} mentioned you`, message: content.slice(0,100), type:"mention", link:`/channels/${channelId}` }});
              // Email if enabled
              try{
                const { enqueueEmail } = await import("@/lib/email");
                await enqueueEmail({ recipient: mentioned.email, subject:`You were mentioned in #${channelId}`, html:`<p>${user.name} mentioned you: ${content}</p>`, templateKey:"announcement" });
              }catch{}
            }
          }
        }catch{}
      }
    }

    // Update channel updatedAt
    try{ await prisma.channel.update({ where:{ id: channelId }, data:{ updatedAt: new Date() }}); }catch{}

    return NextResponse.json({ success:true, data: message }, {status:201});
  }catch(e:any){
    if(e.message?.includes("Forbidden")) return NextResponse.json({ error:e.message }, {status:403});
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
