// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(){
  try{
    const data=await prisma.leaveRequest.findMany({ orderBy:{createdAt:"desc"}, take:20, include:{user:{select:{name:true}}}});
    return NextResponse.json({ data });
  }catch(e:any){ if(/Authentication failed|Can.t reach|P1001/i.test(e.message)){ return NextResponse.json({ data:[], total:0, _warning:"Database unreachable" }); } return NextResponse.json({error:e.message},{status:500});}
}
export async function POST(req:NextRequest){
  const body=await req.json();
  const { userId, type, startDate, endDate, reason }=body;
  if(!userId||!startDate||!endDate) return NextResponse.json({error:"Missing fields"},{status:400});
  try{
    const leave=await prisma.leaveRequest.create({ data:{ userId, type:type||"Casual", startDate:new Date(startDate), endDate:new Date(endDate), reason:reason||"", status:"Pending" }});
    try{
      const user=await prisma.user.findUnique({ where:{ id: userId }});
      if(user?.email){
        const { enqueueEmail } = await import("@/lib/email");
        await enqueueEmail({
          recipient: user.email,
          subject:`Leave request submitted — ${type}`,
          templateKey:"leave_decision",
          relatedEntity:"LeaveRequest", relatedId: leave.id,
          vars:{ staff_name: user.name, payout_status:"Submitted", company_name:"Zyphron Cloud", login_url: process.env.APP_URL||"http://localhost:3000/login" }
        });
      }
    }catch{}
    return NextResponse.json({success:true,data:leave},{status:201});
  }catch(e:any){ return NextResponse.json({error:e.message},{status:500});}
}

