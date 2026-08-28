// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

export async function GET(req:NextRequest){
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const search = searchParams.get("search")||"";
  const page=parseInt(searchParams.get("page")||"1");
  const limit=Math.min(parseInt(searchParams.get("limit")||"20"),100);
  const skip=(page-1)*limit;
  try{
    const where:any={};
    if(status) where.status=status;
    if(priority) where.priority=priority;
    if(search) where.OR=[{title:{contains:search,mode:"insensitive"}},{description:{contains:search,mode:"insensitive"}}];
    const [data,total]=await Promise.all([
      prisma.task.findMany({ where, include:{ department:true, createdBy:{select:{name:true}}, assignments:{include:{user:{select:{name:true,avatar:true}}}}, checklist:true }, orderBy:{createdAt:"desc"}, skip, take:limit }),
      prisma.task.count({where}),
    ]);
    return NextResponse.json({ data, total, page, limit });
  }catch(e:any){ if(/Authentication failed|Can.t reach|P1001/i.test(e.message)){ return NextResponse.json({ data:[], total:0, _warning:"Database unreachable" }); } return NextResponse.json({error:e.message},{status:500});}
}

export async function POST(req:NextRequest){
  try{
    const body=await req.json();
    const { title, description, priority, status, departmentId, assignedTo, deadline, reward, estimatedHours, checklist, tags } = body;
    if(!title) return NextResponse.json({error:"Title required"},{status:400});
    const creator = await prisma.user.findFirst();
    if(!creator) return NextResponse.json({error:"No users in database — create a staff member first"},{status:400});
    const taskId = `ZYP-${Math.floor(100+Math.random()*900)}`;
    const task = await prisma.task.create({
      data:{
        taskId, title, description: description||"", priority: priority||"Medium", status: status||"Backlog",
        departmentId: departmentId||null, createdById: creator.id,
        deadline: deadline? new Date(deadline): null, reward: reward||0, estimatedHours: estimatedHours||null, tags: tags||[],
      }
    });
    if(assignedTo?.length){
      for(const uid of assignedTo){
        await prisma.taskAssignment.create({ data:{ taskId: task.id, userId: uid }});
      }
    }
    if(checklist?.length){
      for(let i=0;i<checklist.length;i++){
        await prisma.taskChecklist.create({ data:{ taskId: task.id, title: checklist[i], sortOrder:i }});
      }
    }
    await prisma.taskActivity.create({ data:{ taskId: task.id, action:"Task created", details:title }});
    await auditLog({ action:"Task created", entity:"Task", entityId:task.id });
    if(assignedTo?.length){
      for(const uid of assignedTo){
        await prisma.notification.create({ data:{ userId: uid, title:`New task assigned: ${title}`, message:`You have been assigned ${taskId}`, link:`/tasks/${task.id}` }});
        try{
          const assignee = await prisma.user.findUnique({ where:{ id: uid }});
          if(assignee?.email){
            const { enqueueEmail } = await import("@/lib/email");
            await enqueueEmail({
              recipient: assignee.email,
              subject: `New task assigned: ${title}`,
              templateKey:"task_assigned",
              relatedEntity:"Task", relatedId: task.id,
              vars:{
                staff_name: assignee.name,
                task_title: title,
                task_deadline: deadline? new Date(deadline).toLocaleDateString("en-IN"):"—",
                task_reward: reward? `₹${reward}`:"—",
                login_url: process.env.APP_URL||"http://localhost:3000/login",
                company_name:"Zyphron Cloud",
              }
            });
          }
        }catch{}
      }
    }
    return NextResponse.json({ success:true, data:task }, {status:201});
  }catch(e:any){ return NextResponse.json({error:e.message},{status:500});}
}

