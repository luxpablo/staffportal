// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(){
  try{
    const users = await prisma.user.findMany({ include:{ department:true, role:true }});
    const data = [];
    for(const u of users){
      const completed = await prisma.task.count({ where:{ assignments:{ some:{ userId:u.id }}, status:"Completed" }});
      const total = await prisma.task.count({ where:{ assignments:{ some:{ userId:u.id }}}});
      const reviews = await prisma.performanceReview.findMany({ where:{ userId:u.id }, orderBy:{createdAt:"desc"}, take:1 });
      const score = reviews[0]?.score ?? (total? Math.round(completed/total*100):0);
      data.push({ id:u.id, name:u.name, role:u.role?.name, department:u.department?.name, score, tasks: total, completed, quality: reviews[0]?.quality||0 });
    }
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
    const body=await req.json();
    const { userId, reviewerId, score, quality, comments }=body;
    if(!userId||!reviewerId||score==null) return NextResponse.json({error:"Missing fields"},{status:400});
    const review=await prisma.performanceReview.create({ data:{ userId, reviewerId, score, quality: quality||0, comments }});
    try{
      const user = await prisma.user.findUnique({ where:{ id: userId }});
      if(user?.email){
        const { enqueueEmail } = await import("@/lib/email");
        await enqueueEmail({
          recipient: user.email,
          subject:"New performance review",
          templateKey:"performance_review",
          relatedEntity:"PerformanceReview", relatedId: review.id,
          vars:{ staff_name: user.name, company_name:"Zyphron Cloud", login_url: process.env.APP_URL||"http://localhost:3000/login" }
        });
      }
    }catch{}
    return NextResponse.json({success:true,data:review},{status:201});
  }catch(e:any){ return NextResponse.json({error:e.message},{status:500}); }
}

