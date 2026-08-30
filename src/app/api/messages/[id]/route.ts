// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireChannelAccess } from "@/lib/channelAuth";

export async function PATCH(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const existing = await prisma.message.findUnique({ where:{ id: params.id }, include:{ channel:true }});
    if(!existing) return NextResponse.json({ error:"Message not found" }, {status:404});
    await requireChannelAccess(user, existing.channelId);
    // Only author or admin/founder can edit
    const isAuthor = existing.authorId===user.id;
    const isMod = user.role?.name==="SUPER_ADMIN" || user.role?.name==="ADMIN";
    if(!isAuthor && !isMod) return NextResponse.json({ error:"Forbidden: cannot edit others' messages" }, {status:403});
    const body = await req.json();
    const { content } = body;
    if(!content?.trim()) return NextResponse.json({ error:"content required" }, {status:400});
    const updated = await prisma.message.update({
      where:{ id: params.id },
      data:{ content: content.trim(), editedAt: new Date() },
      include:{ author:{select:{name:true,avatar:true}} }
    });
    return NextResponse.json({ success:true, data: updated });
  }catch(e:any){
    if(e.message?.includes("Forbidden")) return NextResponse.json({ error:e.message }, {status:403});
    return NextResponse.json({ error:e.message }, {status:500});
  }
}

export async function DELETE(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const existing = await prisma.message.findUnique({ where:{ id: params.id }, include:{ channel:true }});
    if(!existing) return NextResponse.json({ error:"Message not found" }, {status:404});
    await requireChannelAccess(user, existing.channelId);
    const isAuthor = existing.authorId===user.id;
    const isMod = ["SUPER_ADMIN","ADMIN","MANAGER"].includes(user.role?.name);
    if(!isAuthor && !isMod) return NextResponse.json({ error:"Forbidden" }, {status:403});
    // Soft delete
    await prisma.message.update({ where:{ id: params.id }, data:{ deletedAt: new Date(), content:"[deleted]" }});
    return NextResponse.json({ success:true });
  }catch(e:any){
    return NextResponse.json({ error:e.message }, {status:500});
  }
}

export async function GET(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const msg = await prisma.message.findUnique({
      where:{ id: params.id },
      include:{
        author:{select:{name:true,avatar:true}},
        channel:true,
        replyTo:{include:{author:{select:{name:true}}}},
        reactions:{include:{user:{select:{name:true}}}},
        attachments:true,
        replies:{include:{author:{select:{name:true}}, reactions:true}, orderBy:{createdAt:"asc"}}
      }
    });
    if(!msg) return NextResponse.json({ error:"Message not found" }, {status:404});
    await requireChannelAccess(user, msg.channelId);
    return NextResponse.json({ data: msg });
  }catch(e:any){
    if(e.message?.includes("Forbidden")) return NextResponse.json({ error:e.message }, {status:403});
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
