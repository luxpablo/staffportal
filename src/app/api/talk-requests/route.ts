// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req:NextRequest){
  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get("targetId");
  const requesterId = searchParams.get("requesterId");
  const status = searchParams.get("status");
  try{
    const where:any={};
    if(targetId) where.targetId=targetId;
    if(requesterId) where.requesterId=requesterId;
    if(status) where.status=status;
    const data = await prisma.talkRequest.findMany({ where, include:{ requester:{select:{name:true,email:true}}, target:{select:{name:true}} }, orderBy:{ createdAt:"desc" }, take:50 });
    return NextResponse.json({ data });
  }catch(e:any){
    if(/Authentication failed|Can't reach|P1001/i.test(e.message)){
      return NextResponse.json({ data:[], _warning:"Database unreachable" });
    }
    return NextResponse.json({error:e.message},{status:500});
  }
}

export async function POST(req:NextRequest){
  try{
    const { requesterId, targetId, targetRole, reason, preferredTime } = await req.json();
    if(!requesterId || !targetId || !reason?.trim()) return NextResponse.json({error:"requesterId, targetId, reason required"},{status:400});
    const row = await prisma.talkRequest.create({ data:{ requesterId, targetId, targetRole: targetRole||"Unknown", reason: reason.trim(), preferredTime: preferredTime||null, status:"Pending" }});
    try{
      await prisma.notification.create({ data:{ userId: targetId, title:`Talk request from ${requesterId}`, message: reason.slice(0,100), type:"talk_request" }});
    }catch{}
    return NextResponse.json({ success:true, data: row }, {status:201});
  }catch(e:any){ return NextResponse.json({error:e.message},{status:500}); }
}

export async function PATCH(req:NextRequest){
  try{
    const { id, status, response, assignedTime } = await req.json();
    if(!id || !status) return NextResponse.json({error:"id, status required"},{status:400});
    const allowed = ["Pending","Waiting","Approved","Assign Time","Assigned Time","Rejected","Completed","Accepted"];
    if(!allowed.includes(status)) return NextResponse.json({error:`Invalid status — allowed: ${allowed.join(", ")}`},{status:400});
    // Normalize: Waiting ↔ Pending, Assign Time → Assigned Time
    let finalStatus = status;
    if(status==="Waiting") finalStatus="Pending";
    if(status==="Assign Time") finalStatus="Assigned Time";
    if(status==="Accepted") finalStatus="Approved";
    const data:any={ status: finalStatus };
    if(response) data.response=response;
    if(assignedTime) data.response=`Assigned Time: ${assignedTime}` + (response? ` — ${response}`:"");
    // If approved/assigned time, also update with response
    const row = await prisma.talkRequest.update({ where:{ id }, data });
    try{
      const updated = await prisma.talkRequest.findUnique({ where:{ id }, include:{ requester:{select:{name:true}} }});
      if(updated){
        await prisma.notification.create({ data:{ userId: updated.requesterId, title:`Talk request ${finalStatus}`, message: `Your talk request to ${updated.targetRole} is ${finalStatus}${assignedTime? ` at ${assignedTime}`:""}`, type:"talk_request_update" }});
      }
    }catch{}
    return NextResponse.json({ success:true, data: row });
  }catch(e:any){ return NextResponse.json({error:e.message},{status:500}); }
}
