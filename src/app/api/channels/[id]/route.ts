// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireChannelAccess, canPerform, isFounder } from "@/lib/channelAuth";
import { auditLog } from "@/lib/audit";

export async function GET(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const channel = await requireChannelAccess(user, params.id);
    const full = await prisma.channel.findUnique({
      where:{ id: params.id },
      include:{
        members:{ include:{ user:{select:{id:true,name:true,avatar:true,status:true}} }},
        department:{select:{name:true}},
        createdBy:{select:{name:true}},
        _count:{select:{messages:true}}
      }
    });
    return NextResponse.json({ data: full });
  }catch(e:any){
    if(e.message?.includes("Forbidden")) return NextResponse.json({ error:e.message }, {status:403});
    if(e.message?.includes("not found")) return NextResponse.json({ error:"Channel not found" }, {status:404});
    return NextResponse.json({ error:e.message }, {status:500});
  }
}

export async function PATCH(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const channel = await requireChannelAccess(user, params.id);
    // Check permission to update
    const isMember = await prisma.channelMember.findUnique({ where:{ channelId_userId:{ channelId: params.id, userId: user.id } }});
    const canUpdate = isFounder(user) || isMember?.role==="OWNER" || isMember?.role==="ADMIN";
    if(!canUpdate) return NextResponse.json({ error:"Forbidden: insufficient permissions to update channel" }, {status:403});
    const body = await req.json();
    const { name, description, topic, isPrivate, isArchived } = body;
    const data:any={};
    if(name) data.name=name.toLowerCase().trim().replace(/\s+/g,"-");
    if(description!==undefined) data.description=description;
    if(topic!==undefined) data.topic=topic;
    if(isPrivate!==undefined) data.isPrivate=!!isPrivate;
    if(isArchived!==undefined){
      if(!canPerform(user, "channel:archive", channel)) return NextResponse.json({ error:"Forbidden to archive" }, {status:403});
      data.isArchived=!!isArchived;
    }
    const updated = await prisma.channel.update({ where:{ id: params.id }, data });
    await auditLog({ userId: user.id, action:"Channel updated", entity:"Channel", entityId: params.id, oldValue: channel, newValue: data });
    return NextResponse.json({ success:true, data: updated });
  }catch(e:any){
    return NextResponse.json({ error:e.message }, {status:500});
  }
}

export async function DELETE(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const channel = await requireChannelAccess(user, params.id);
    if(!isFounder(user)){
      const member = await prisma.channelMember.findUnique({ where:{ channelId_userId:{ channelId: params.id, userId: user.id } }});
      if(member?.role!=="OWNER") return NextResponse.json({ error:"Only channel owner or founder can delete" }, {status:403});
    }
    // Soft archive instead of hard delete for audit
    await prisma.channel.update({ where:{ id: params.id }, data:{ isArchived:true }});
    await auditLog({ userId: user.id, action:"Channel archived", entity:"Channel", entityId: params.id });
    return NextResponse.json({ success:true });
  }catch(e:any){
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
