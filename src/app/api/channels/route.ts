// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canAccessChannel, isFounder } from "@/lib/channelAuth";
import { auditLog } from "@/lib/audit";

export async function GET(req:NextRequest){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")||"";
    const type = searchParams.get("type");
    const workspaceId = searchParams.get("workspaceId");
    const departmentId = searchParams.get("departmentId");
    const includeArchived = searchParams.get("includeArchived")==="true";

    const where:any={};
    if(search) where.OR=[{name:{contains:search,mode:"insensitive"}},{description:{contains:search,mode:"insensitive"}}];
    if(type) where.type=type;
    if(workspaceId) where.workspaceId=workspaceId;
    if(departmentId) where.departmentId=departmentId;
    if(!includeArchived) where.isArchived=false;

    let channels = await prisma.channel.findMany({
      where,
      include:{ members:{ include:{ user:{select:{name:true,avatar:true}} }}, _count:{select:{messages:true, members:true}}, department:{select:{name:true}}, createdBy:{select:{name:true}} },
      orderBy:{ createdAt:"asc" },
      take:100,
    });

    // Filter by hierarchical access
    const filtered:any[]=[];
    for(const ch of channels){
      if(await canAccessChannel(user, ch)){
        // Add unread count, last read
        const member = ch.members.find((m:any)=> m.userId===user.id);
        let unreadCount = 0;
        if(member?.lastReadAt){
          unreadCount = await prisma.message.count({ where:{ channelId: ch.id, createdAt:{ gt: member.lastReadAt }, deletedAt:null }});
        } else if(member){
          unreadCount = ch._count.messages;
        } else if(!ch.isPrivate){
          // For public channels not joined, show 0 unread but still visible
          unreadCount = 0;
        }
        filtered.push({ ...ch, unreadCount, isMember: !!member });
      }
    }

    return NextResponse.json({ data: filtered });
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
    const { name, description, type, workspaceId, departmentId, isPrivate, topic, members } = body;
    if(!name || !name.trim()) return NextResponse.json({ error:"Channel name required" }, {status:400});
    const cleanName = name.toLowerCase().trim().replace(/\s+/g,"-").replace(/[^a-z0-9-_]/g,"");
    if(cleanName.length<2) return NextResponse.json({ error:"Invalid channel name" }, {status:400});
    // Check duplicate per workspace
    const existing = await prisma.channel.findFirst({ where:{ name: cleanName, workspaceId: workspaceId||null }});
    if(existing) return NextResponse.json({ error:"Channel name already exists in this workspace" }, {status:409});

    // Permission: only manager+ can create private/management channels, staff can create public/project/support if allowed
    // For now allow all authenticated, but log
    const channel = await prisma.channel.create({
      data:{
        name: cleanName,
        slug: cleanName,
        description: description||null,
        type: type||"PUBLIC",
        workspaceId: workspaceId||null,
        departmentId: departmentId||null,
        createdById: user.id,
        isPrivate: !!isPrivate,
        topic: topic||null,
      }
    });
    // Add creator as OWNER
    await prisma.channelMember.create({ data:{ channelId: channel.id, userId: user.id, role:"OWNER" }});
    // Add initial members
    if(Array.isArray(members)){
      for(const uid of members){
        if(uid===user.id) continue;
        try{ await prisma.channelMember.create({ data:{ channelId: channel.id, userId: uid, role:"MEMBER" }}); }catch{}
      }
    }
    await auditLog({ userId: user.id, action:"Channel created", entity:"Channel", entityId: channel.id, newValue:{ name: cleanName, type, isPrivate }});
    // Notify via in-app for members
    if(members?.length){
      for(const uid of members){
        try{ await prisma.notification.create({ data:{ userId: uid, title:`Added to #${cleanName}`, message:`You were added to #${cleanName} by ${user.name}`, type:"channel_invite", link:`/channels/${channel.id}` }}); }catch{}
      }
    }
    return NextResponse.json({ success:true, data: channel }, {status:201});
  }catch(e:any){
    if(e.code==="P2002") return NextResponse.json({ error:"Channel already exists" }, {status:409});
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
