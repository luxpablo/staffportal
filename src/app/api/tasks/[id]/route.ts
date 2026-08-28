// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

export async function PATCH(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const body=await req.json();
    const id=params.id;
    const task=await prisma.task.update({ where:{id}, data: body });
    if(body.status){
      await prisma.taskActivity.create({ data:{ taskId:id, action:`Status changed to ${body.status}`, details: body.status }});
      await auditLog({ action:"Task updated", entity:"Task", entityId:id, newValue: body });
      if(body.status==="Completed" || body.status==="Approved"){
        const full=await prisma.task.findUnique({ where:{id}, include:{ assignments:{ include:{ user:true }}}});
        if(full?.reward && full.assignments.length){
          for(const a of full.assignments){
            await prisma.earningsTransaction.create({ data:{ userId:a.userId, amount: full.reward, type:"CREDIT", category:"TASK_REWARD", description:`Reward for ${full.taskId}`, balanceAfter:null }});
            try{
              const { enqueueEmail } = await import("@/lib/email");
              await enqueueEmail({
                recipient: (a as any).user?.email || "",
                subject: `Task approved: ${full.title}`,
                templateKey:"task_approved",
                relatedEntity:"Task", relatedId:id,
                vars:{ staff_name:(a as any).user?.name||"", task_title: full.title, payout_amount:`₹${full.reward}`, company_name:"Zyphron Cloud", login_url: process.env.APP_URL||"http://localhost:3000/login" }
              });
            }catch{}
          }
        }
      }
      if(body.status==="Rejected"){
        const full=await prisma.task.findUnique({ where:{id}, include:{ assignments:{ include:{ user:true }}}});
        if(full){
          for(const a of full.assignments){
            try{
              const { enqueueEmail } = await import("@/lib/email");
              await enqueueEmail({
                recipient:(a as any).user?.email||"", subject:`Task needs changes: ${full.title}`, templateKey:"task_rejected", relatedEntity:"Task", relatedId:id,
                vars:{ staff_name:(a as any).user?.name||"", task_title: full.title, company_name:"Zyphron Cloud", login_url: process.env.APP_URL||"http://localhost:3000/login" }
              });
            }catch{}
          }
        }
      }
    }
    return NextResponse.json({ success:true, data:task });
  }catch(e:any){ return NextResponse.json({error:e.message},{status:500});}
}

export async function GET(_:NextRequest, {params}:{params:{id:string}}){
  try{
    const task=await prisma.task.findUnique({ where:{id:params.id}, include:{ assignments:{include:{user:true}}, comments:true, checklist:true, activities:true }});
    if(!task) return NextResponse.json({ error:"Not found"}, {status:404});
    return NextResponse.json({ data:task });
  }catch(e:any){ return NextResponse.json({error:e.message},{status:500});}
}

