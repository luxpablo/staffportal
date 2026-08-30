// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canCreateMeeting, canAccessMeeting } from "@/lib/meetingAuth";
import { auditLog } from "@/lib/audit";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function genCode(){
  return `ZYP-MEET-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function GET(req:NextRequest){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const workspaceId = searchParams.get("workspaceId");
    const departmentId = searchParams.get("departmentId");
    const where:any={};
    if(status) where.status=status;
    if(type) where.type=type;
    if(workspaceId) where.workspaceId=workspaceId;
    if(departmentId) where.departmentId=departmentId;

    let meetings = await prisma.meeting.findMany({
      where,
      include:{
        host:{select:{id:true,name:true,avatar:true}},
        department:{select:{name:true}},
        channel:{select:{name:true}},
        participants:{include:{user:{select:{name:true,avatar:true}}}},
        _count:{select:{participants:true}}
      },
      orderBy:{ scheduledStart:"asc" },
      take:100,
    });

    // Filter by hierarchical access
    const filtered=[];
    for(const m of meetings){
      if(await canAccessMeeting(user, m)) filtered.push(m);
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
    const { title, description, workspaceId, departmentId, channelId, type, scheduledStart, scheduledEnd, waitingRoomEnabled, recordingEnabled, screenShareEnabled, chatEnabled, maxParticipants, password, participants, timezone, recurrenceRule } = body;
    if(!title || !scheduledStart || !scheduledEnd) return NextResponse.json({ error:"title, scheduledStart, scheduledEnd required" }, {status:400});
    if(!canCreateMeeting(user, type||"SCHEDULED")) return NextResponse.json({ error:"Forbidden: cannot create this meeting type" }, {status:403});
    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);
    if(end <= start) return NextResponse.json({ error:"End must be after start" }, {status:400});
    if(end.getTime() - start.getTime() > 24*3600000*7) return NextResponse.json({ error:"Meeting too long" }, {status:400});

    const meetingCode = genCode();
    let passwordHash = null;
    if(password) passwordHash = await bcrypt.hash(password, 10);

    const meeting = await prisma.meeting.create({
      data:{
        title: title.trim(),
        description: description||null,
        hostId: user.id,
        workspaceId: workspaceId||null,
        departmentId: departmentId||null,
        channelId: channelId||null,
        type: type||"SCHEDULED",
        status:"SCHEDULED",
        scheduledStart: start,
        scheduledEnd: end,
        meetingCode,
        passwordHash,
        waitingRoomEnabled: !!waitingRoomEnabled,
        recordingEnabled: !!recordingEnabled,
        screenShareEnabled: screenShareEnabled!==false,
        chatEnabled: chatEnabled!==false,
        maxParticipants: maxParticipants||50,
      }
    });

    // Add host as HOST participant
    await prisma.meetingParticipant.create({ data:{ meetingId: meeting.id, userId: user.id, role:"HOST", status:"JOINED", joinedAt: new Date() }});

    // Add invited participants
    if(Array.isArray(participants)){
      for(const uid of participants){
        if(uid===user.id) continue;
        try{
          await prisma.meetingParticipant.create({ data:{ meetingId: meeting.id, userId: uid, role:"PARTICIPANT", status:"INVITED" }});
          await prisma.notification.create({ data:{ userId: uid, title:`Meeting invited: ${title}`, message:`${user.name} invited you to ${title} at ${start.toLocaleString("en-IN")}`, type:"meeting_invite", link:`/meet/${meeting.meetingCode}` }});
          // Email
          try{
            const target = await prisma.user.findUnique({ where:{ id: uid }});
            if(target?.email){
              const { enqueueEmail } = await import("@/lib/email");
              await enqueueEmail({ recipient: target.email, subject:`Meeting invitation: ${title}`, html:`<p>You are invited to <strong>${title}</strong> by ${user.name} at ${start.toLocaleString("en-IN")}</p><p><a href="${process.env.APP_URL}/meet/${meetingCode}">Join</a></p>`, templateKey:"announcement" });
            }
          }catch{}
        }catch{}
      }
    }

    // Create calendar event
    try{
      await prisma.calendarEvent.create({
        data:{
          title,
          description: description||null,
          type:"MEETING",
          creatorId: user.id,
          workspaceId: workspaceId||null,
          departmentId: departmentId||null,
          meetingId: meeting.id,
          visibility: type==="COMPANY" ? "COMPANY" : type==="DEPARTMENT" ? "DEPARTMENT" : "PARTICIPANTS",
          startsAt: start,
          endsAt: end,
          timezone: timezone||"Asia/Kolkata",
          recurrenceRule: recurrenceRule||null,
        }
      });
    }catch{}

    await auditLog({ userId: user.id, action:"Meeting created", entity:"Meeting", entityId: meeting.id, newValue:{ title, type, scheduledStart }});
    return NextResponse.json({ success:true, data: meeting }, {status:201});
  }catch(e:any){
    if(e.code==="P2002") return NextResponse.json({ error:"Meeting code conflict, retry" }, {status:409});
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
