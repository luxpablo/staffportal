// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req:NextRequest){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const conversations = await prisma.conversation.findMany({
      where:{ members:{ some:{ userId: user.id } } },
      include:{
        members:{ include:{ user:{select:{id:true,name:true,avatar:true,status:true}} }},
        messages:{ orderBy:{ createdAt:"desc" }, take:1, include:{author:{select:{name:true}}}},
        _count:{select:{messages:true}}
      },
      orderBy:{ updatedAt:"desc" },
      take:50,
    });
    // Add unread count
    const withUnread = await Promise.all(conversations.map(async (c:any)=>{
      const member = c.members.find((m:any)=> m.userId===user.id);
      let unread = 0;
      if(member?.lastReadAt){
        unread = await prisma.directMessage.count({ where:{ conversationId: c.id, createdAt:{ gt: member.lastReadAt }, deletedAt:null }});
      } else {
        unread = c._count.messages;
      }
      return { ...c, unreadCount: unread, isGroup: c.type==="GROUP" };
    }));
    return NextResponse.json({ data: withUnread });
  }catch(e:any){
    if(/Authentication failed|Can't reach|P1001/i.test(e.message)){
      return NextResponse.json({ data:[], _warning:"Database unreachable" });
    }
    return NextResponse.json({ error:e.message }, {status:500});
  }
}

export async function POST(req:NextRequest){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const body = await req.json();
    const { type, name, memberIds, participantId } = body;
    // For 1-1 DM, participantId is the other user
    let members: string[] = [];
    if(type==="GROUP"){
      if(!memberIds || !Array.isArray(memberIds) || memberIds.length<2) return NextResponse.json({ error:"Group DM requires at least 2 members" }, {status:400});
      members = [...new Set([user.id, ...memberIds])];
    } else {
      if(!participantId) return NextResponse.json({ error:"participantId required for DM" }, {status:400});
      if(participantId===user.id) return NextResponse.json({ error:"Cannot DM yourself" }, {status:400});
      // Check if DM already exists between these two
      const existing = await prisma.conversation.findFirst({
        where:{
          type:"DIRECT",
          AND:[
            { members:{ some:{ userId: user.id } }},
            { members:{ some:{ userId: participantId } }},
            { members:{ none:{ userId:{ notIn:[user.id, participantId] } } }},
          ]
        },
        include:{ members:true }
      });
      // More precise check: find conversations where exactly these 2 members
      if(existing){
        const count = await prisma.conversationMember.count({ where:{ conversationId: existing.id }});
        if(count===2) return NextResponse.json({ success:true, data: existing });
      }
      members = [user.id, participantId];
    }
    // Check RBAC: can these users DM each other? For now allow all authenticated, but could check department
    // Verify all members exist and are not blocked
    for(const uid of members){
      const u = await prisma.user.findUnique({ where:{ id: uid }});
      if(!u) return NextResponse.json({ error:`User ${uid} not found` }, {status:404});
    }
    const convo = await prisma.conversation.create({
      data:{
        type: type==="GROUP" ? "GROUP" : "DIRECT",
        name: type==="GROUP" ? (name||"Group DM") : null,
        createdById: user.id,
        members:{ create: members.map(uid=> ({ userId: uid, role: uid===user.id?"OWNER":"MEMBER" })) }
      },
      include:{ members:{ include:{ user:{select:{name:true}} } } }
    });
    return NextResponse.json({ success:true, data: convo }, {status:201});
  }catch(e:any){
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
