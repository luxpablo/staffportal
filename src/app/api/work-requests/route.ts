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
    const data = await prisma.workRequest.findMany({ where, include:{ requester:{select:{name:true,email:true}}, target:{select:{name:true}} }, orderBy:{ createdAt:"desc" }, take:50 });
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
    const { requesterId, targetId, targetRole, title, description, priority, deadline } = await req.json();
    if(!requesterId || !targetId || !title?.trim() || !description?.trim()) return NextResponse.json({error:"requesterId, targetId, title, description required"},{status:400});
    const row = await prisma.workRequest.create({
      data:{ requesterId, targetId, targetRole: targetRole||"Unknown", title: title.trim(), description: description.trim(), priority: priority||"Medium", deadline: deadline? new Date(deadline): null, status:"Pending" }
    });
    try{
      await prisma.notification.create({ data:{ userId: targetId, title:`Work request: ${title}`, message: description.slice(0,100), type:"work_request" }});
    }catch{}
    return NextResponse.json({ success:true, data: row }, {status:201});
  }catch(e:any){ return NextResponse.json({error:e.message},{status:500}); }
}

export async function PATCH(req:NextRequest){
  try{
    const { id, status, notes } = await req.json();
    if(!id || !status) return NextResponse.json({error:"id, status required"},{status:400});
    const allowed = ["Pending","Waiting","Approved","Accepted","Rejected","In Progress","Completed","Assigned Time"];
    if(!allowed.includes(status)) return NextResponse.json({error:`Invalid status — allowed: ${allowed.join(", ")}`},{status:400});
    let finalStatus = status;
    if(status==="Waiting") finalStatus="Pending";
    if(status==="Accepted"||status==="Approved") finalStatus="Approved";
    const row = await prisma.workRequest.update({ where:{ id }, data:{ status: finalStatus }});
    // If approved/accepted, create a Task assigned to target (work to be done BY target)
    if(finalStatus==="Approved"){
      try{
        const wr = await prisma.workRequest.findUnique({ where:{ id }});
        if(wr){
          const taskId = `ZYP-${Math.floor(100+Math.random()*900)}`;
          const task = await prisma.task.create({
            data:{ taskId, title: wr.title, description: wr.description, priority: wr.priority, status:"Assigned", deadline: wr.deadline, reward:0, createdById: wr.requesterId }
          });
          await prisma.taskAssignment.create({ data:{ taskId: task.id, userId: wr.targetId }});
          await prisma.notification.create({ data:{ userId: wr.requesterId, title:`Work request approved`, message:`${wr.title} approved — task ${taskId} created`, type:"work_request" }});
        }
      }catch{}
    }
    if(finalStatus==="Completed"){
      try{
        const wr = await prisma.workRequest.findUnique({ where:{ id }});
        if(wr){
          // mark related task as completed if exists
          const task = await prisma.task.findFirst({ where:{ title: wr.title, createdById: wr.requesterId }, orderBy:{ createdAt:"desc" }});
          if(task) await prisma.task.update({ where:{ id: task.id }, data:{ status:"Completed" }});
        }
      }catch{}
    }
    return NextResponse.json({ success:true, data: row });
  }catch(e:any){ return NextResponse.json({error:e.message},{status:500}); }
}
