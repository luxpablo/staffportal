// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canAccessMeeting } from "@/lib/meetingAuth";
import bcrypt from "bcryptjs";

export async function POST(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const meeting = await prisma.meeting.findUnique({ where:{ id: params.id }, include:{ participants:true }});
    if(!meeting) return NextResponse.json({ error:"Meeting not found" }, {status:404});
    if(meeting.isLocked) return NextResponse.json({ error:"Meeting is locked" }, {status:403});
    if(meeting.status==="CANCELLED") return NextResponse.json({ error:"Meeting cancelled" }, {status:410});
    if(meeting.status==="ENDED") return NextResponse.json({ error:"Meeting ended" }, {status:410});

    // Check password if set
    const body = await req.json().catch(()=>({}));
    if(meeting.passwordHash){
      const pw = body.password;
      if(!pw) return NextResponse.json({ error:"Password required" }, {status:401});
      const ok = await bcrypt.compare(pw, meeting.passwordHash);
      if(!ok) return NextResponse.json({ error:"Invalid password" }, {status:403});
    }

    const can = await canAccessMeeting(user, meeting);
    if(!can) return NextResponse.json({ error:"Forbidden: not invited and no access" }, {status:403});

    let participant = await prisma.meetingParticipant.findUnique({ where:{ meetingId_userId:{ meetingId: params.id, userId: user.id } }});
    if(!participant){
      // Auto-join if public/company or invited? For now, allow if canAccess
      participant = await prisma.meetingParticipant.create({
        data:{ meetingId: params.id, userId: user.id, role:"PARTICIPANT", status: meeting.waitingRoomEnabled ? "WAITING" : "JOINED", joinedAt: meeting.waitingRoomEnabled ? null : new Date() }
      });
    } else if(participant.status==="WAITING" && !meeting.waitingRoomEnabled){
      participant = await prisma.meetingParticipant.update({ where:{ id: participant.id }, data:{ status:"JOINED", joinedAt: new Date() }});
    } else if(participant.status==="INVITED"){
      participant = await prisma.meetingParticipant.update({ where:{ id: participant.id }, data:{ status: meeting.waitingRoomEnabled ? "WAITING" : "JOINED", joinedAt: meeting.waitingRoomEnabled ? null : new Date() }});
    } else if(participant.status!=="JOINED" && participant.status!=="WAITING"){
      participant = await prisma.meetingParticipant.update({ where:{ id: participant.id }, data:{ status: meeting.waitingRoomEnabled ? "WAITING" : "JOINED", joinedAt: new Date() }});
    }

    // If meeting not yet LIVE and user is host, set to LIVE
    if(meeting.hostId===user.id && meeting.status==="SCHEDULED"){
      await prisma.meeting.update({ where:{ id: params.id }, data:{ status:"LIVE", startedAt: new Date() }});
    }

    // Generate short-lived token for WebRTC (via provider)
    const { getMeetingProvider } = await import("@/lib/meetingProvider");
    const provider = await getMeetingProvider();
    const token = await provider.generateToken(meeting.id, user.id, meeting.hostId===user.id);

    return NextResponse.json({
      success:true,
      data: { participant, meetingCode: meeting.meetingCode, status: participant.status, token, provider: provider.name, waiting: participant.status==="WAITING" },
      message: participant.status==="WAITING" ? "Please wait for the host to admit you." : "Joined"
    });
  }catch(e:any){
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
