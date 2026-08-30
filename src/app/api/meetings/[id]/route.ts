// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireMeetingAccess, canManageMeeting } from "@/lib/meetingAuth";
import { auditLog } from "@/lib/audit";

export async function GET(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const meeting = await requireMeetingAccess(user, params.id);
    const full = await prisma.meeting.findUnique({
      where:{ id: params.id },
      include:{
        host:{select:{id:true,name:true,avatar:true}},
        department:{select:{name:true}},
        channel:{select:{name:true}},
        participants:{include:{user:{select:{id:true,name:true,avatar:true,status:true}}}},
        calendarEvent:true,
      }
    });
    return NextResponse.json({ data: full });
  }catch(e:any){
    if(e.message?.includes("Forbidden")) return NextResponse.json({ error:e.message }, {status:403});
    if(e.message?.includes("not found")) return NextResponse.json({ error:"Meeting not found" }, {status:404});
    return NextResponse.json({ error:e.message }, {status:500});
  }
}

export async function PATCH(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const meeting = await requireMeetingAccess(user, params.id);
    if(!await canManageMeeting(user, meeting)) return NextResponse.json({ error:"Forbidden: cannot manage meeting" }, {status:403});
    const body = await req.json();
    const { title, description, scheduledStart, scheduledEnd, status, isLocked, waitingRoomEnabled } = body;
    const data:any={};
    if(title) data.title=title;
    if(description!==undefined) data.description=description;
    if(scheduledStart) data.scheduledStart=new Date(scheduledStart);
    if(scheduledEnd) data.scheduledEnd=new Date(scheduledEnd);
    if(status) data.status=status;
    if(isLocked!==undefined) data.isLocked=!!isLocked;
    if(waitingRoomEnabled!==undefined) data.waitingRoomEnabled=!!waitingRoomEnabled;
    if(body.endedAt) data.endedAt=new Date(body.endedAt);
    if(body.startedAt) data.startedAt=new Date(body.startedAt);
    const updated = await prisma.meeting.update({ where:{ id: params.id }, data });
    // Update calendar event if times changed
    if(scheduledStart || scheduledEnd){
      try{
        await prisma.calendarEvent.update({ where:{ meetingId: params.id }, data:{
          startsAt: scheduledStart ? new Date(scheduledStart) : undefined,
          endsAt: scheduledEnd ? new Date(scheduledEnd) : undefined,
        }});
      }catch{}
    }
    await auditLog({ userId: user.id, action:"Meeting updated", entity:"Meeting", entityId: params.id, newValue: data });
    return NextResponse.json({ success:true, data: updated });
  }catch(e:any){
    return NextResponse.json({ error:e.message }, {status:500});
  }
}

export async function DELETE(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const meeting = await requireMeetingAccess(user, params.id);
    if(!await canManageMeeting(user, meeting)) return NextResponse.json({ error:"Forbidden" }, {status:403});
    await prisma.meeting.update({ where:{ id: params.id }, data:{ status:"CANCELLED" }});
    try{ await prisma.calendarEvent.delete({ where:{ meetingId: params.id }}); }catch{}
    await auditLog({ userId: user.id, action:"Meeting cancelled", entity:"Meeting", entityId: params.id });
    return NextResponse.json({ success:true });
  }catch(e:any){
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
