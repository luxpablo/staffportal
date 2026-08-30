// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getRoleLevel, isFounder } from "@/lib/channelAuth";

export async function GET(req:NextRequest){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view")||"month"; // month, week, day, agenda
    const dateStr = searchParams.get("date");
    const base = dateStr ? new Date(dateStr) : new Date();
    // Determine range based on view
    let start:Date, end:Date;
    if(view==="day"){
      start=new Date(base); start.setHours(0,0,0,0);
      end=new Date(base); end.setHours(23,59,59,999);
    } else if(view==="week"){
      const day=base.getDay();
      start=new Date(base); start.setDate(base.getDate()-day); start.setHours(0,0,0,0);
      end=new Date(start); end.setDate(start.getDate()+6); end.setHours(23,59,59,999);
    } else if(view==="agenda"){
      start=new Date(base); start.setHours(0,0,0,0);
      end=new Date(base); end.setDate(base.getDate()+14); end.setHours(23,59,59,999);
    } else { // month
      start=new Date(base.getFullYear(), base.getMonth(), 1); start.setHours(0,0,0,0);
      end=new Date(base.getFullYear(), base.getMonth()+1, 0); end.setHours(23,59,59,999);
    }

    let events = await prisma.calendarEvent.findMany({
      where:{ startsAt:{ gte: start, lte: end }},
      include:{
        creator:{select:{name:true}},
        meeting:{select:{meetingCode:true, status:true, hostId:true}},
        department:{select:{name:true}}
      },
      orderBy:{ startsAt:"asc" },
      take:200,
    });

    // Filter by visibility + hierarchical access
    const filtered=[];
    for(const ev of events){
      if(ev.visibility==="COMPANY"){ filtered.push(ev); continue; }
      if(ev.visibility==="PRIVATE" && ev.creatorId!==user.id){
        // Only founder can see private? Check if user is participant
        if(ev.meetingId){
          const part = await prisma.meetingParticipant.findUnique({ where:{ meetingId_userId:{ meetingId: ev.meetingId, userId: user.id } }});
          if(!part && !isFounder(user)) continue;
        } else continue;
      }
      if(ev.visibility==="DEPARTMENT" && ev.departmentId){
        if(user.departmentId!==ev.departmentId && getRoleLevel(user.role?.name) < 50) continue;
      }
      if(ev.visibility==="PARTICIPANTS" && ev.meetingId){
        const part = await prisma.meetingParticipant.findUnique({ where:{ meetingId_userId:{ meetingId: ev.meetingId, userId: user.id } }});
        if(!part && ev.creatorId!==user.id && !isFounder(user)) continue;
      }
      filtered.push(ev);
    }

    // Also include tasks deadlines and leave for personal calendar
    // For now, just return filtered events
    return NextResponse.json({ data: filtered, start, end, view });
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
    const { title, description, type, workspaceId, departmentId, startsAt, endsAt, timezone, visibility, recurrenceRule, isAllDay, meetingId, taskId } = body;
    if(!title || !startsAt || !endsAt) return NextResponse.json({ error:"title, startsAt, endsAt required" }, {status:400});
    const start=new Date(startsAt);
    const end=new Date(endsAt);
    if(end <= start) return NextResponse.json({ error:"End must be after start" }, {status:400});
    const ev = await prisma.calendarEvent.create({
      data:{
        title: title.trim(),
        description: description||null,
        type: type||"COMPANY_EVENT",
        creatorId: user.id,
        workspaceId: workspaceId||null,
        departmentId: departmentId||null,
        meetingId: meetingId||null,
        taskId: taskId||null,
        visibility: visibility||"PRIVATE",
        startsAt: start,
        endsAt: end,
        timezone: timezone||"Asia/Kolkata",
        recurrenceRule: recurrenceRule||null,
        isAllDay: !!isAllDay,
      }
    });
    return NextResponse.json({ success:true, data: ev }, {status:201});
  }catch(e:any){
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
