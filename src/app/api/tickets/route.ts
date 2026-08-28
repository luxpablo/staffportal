// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(req:NextRequest){
  const status=new URL(req.url).searchParams.get("status");
  try{
    const where:any={}; if(status) where.status=status;
    const data=await prisma.ticket.findMany({ where, orderBy:{createdAt:"desc"}, take:20, include:{ assignments:{include:{user:{select:{name:true}}}}}});
    return NextResponse.json({ data });
  }catch(e:any){ if(/Authentication failed|Can.t reach|P1001/i.test(e.message)){ return NextResponse.json({ data:[], total:0, _warning:"Database unreachable" }); } return NextResponse.json({error:e.message},{status:500});}
}
export async function POST(req:NextRequest){
  const body=await req.json();
  const { customer, subject, category, priority }=body;
  if(!customer||!subject) return NextResponse.json({error:"Missing fields"},{status:400});
  try{
    const ticketId=`TKT-${Math.floor(100+Math.random()*900)}`;
    const ticket=await prisma.ticket.create({ data:{ ticketId, customer, subject, category:category||"General", priority:priority||"Medium", status:"Open" }});
    // optional: if assigned via body.assignedTo, queue email — handled by assignment endpoint
    return NextResponse.json({success:true,data:ticket},{status:201});
  }catch(e:any){ return NextResponse.json({error:e.message},{status:500});}
}

