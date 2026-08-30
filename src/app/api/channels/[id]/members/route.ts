// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireChannelAccess } from "@/lib/channelAuth";
import { auditLog } from "@/lib/audit";

export async function POST(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    await requireChannelAccess(user, params.id);
    const { userId, role } = await req.json();
    if(!userId) return NextResponse.json({ error:"userId required" }, {status:400});
    // Check if already member
    const existing = await prisma.channelMember.findUnique({ where:{ channelId_userId:{ channelId: params.id, userId } }});
    if(existing) return NextResponse.json({ error:"Already a member" }, {status:409});
    const member = await prisma.channelMember.create({ data:{ channelId: params.id, userId, role: role||"MEMBER" }});
    await auditLog({ userId: user.id, action:"Channel member added", entity:"ChannelMember", entityId: member.id, newValue:{ channelId: params.id, userId }});
    try{ await prisma.notification.create({ data:{ userId, title:`Added to channel`, message:`You were added to a channel by ${user.name}`, type:"channel_invite" }}); }catch{}
    return NextResponse.json({ success:true, data: member }, {status:201});
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}

export async function DELETE(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    await requireChannelAccess(user, params.id);
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("userId") || (await req.json().catch(()=>({}))).userId;
    if(!uid) return NextResponse.json({ error:"userId required" }, {status:400});
    await prisma.channelMember.delete({ where:{ channelId_userId:{ channelId: params.id, userId: uid } }});
    await auditLog({ userId: user.id, action:"Channel member removed", entity:"ChannelMember", entityId: params.id, newValue:{ channelId: params.id, userId: uid }});
    return NextResponse.json({ success:true });
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}

export async function GET(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    await requireChannelAccess(user, params.id);
    const members = await prisma.channelMember.findMany({ where:{ channelId: params.id }, include:{ user:{select:{id:true,name:true,avatar:true,status:true,role:true}} }, orderBy:{ joinedAt:"asc" }});
    return NextResponse.json({ data: members });
  }catch(e:any){
    if(e.message?.includes("Forbidden")) return NextResponse.json({ error:e.message }, {status:403});
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
