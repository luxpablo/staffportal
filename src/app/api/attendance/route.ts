// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(){
  try{
    const data=await prisma.attendance.findMany({ orderBy:{date:"desc"}, take:20, include:{user:{select:{name:true}}}});
    return NextResponse.json({ data });
  }catch(e:any){ if(/Authentication failed|Can.t reach|P1001/i.test(e.message)){ return NextResponse.json({ data:[], total:0, _warning:"Database unreachable" }); } return NextResponse.json({error:e.message},{status:500});}
}
export async function POST(req:NextRequest){
  const body=await req.json();
  const { userId, action }=body;
  if(!userId||!action) return NextResponse.json({error:"Missing fields"},{status:400});
  try{
    const today=new Date(); today.setHours(0,0,0,0);
    let att=await prisma.attendance.findFirst({ where:{ userId, date:today }});
    if(!att) att=await prisma.attendance.create({ data:{ userId, date:today, status:"Present", clockIn: action==="clockIn"? new Date(): null }});
    else{
      const update:any={};
      const now=new Date();
      if(action==="clockIn" && !att.clockIn) update.clockIn=now;
      if(action==="clockOut") { update.clockOut=now; if(att.clockIn) update.workingHours=(now.getTime()-new Date(att.clockIn).getTime())/3600000; }
      if(action==="breakStart") update.breakStart=now;
      if(action==="breakEnd") update.breakEnd=now;
      if(Object.keys(update).length) att=await prisma.attendance.update({ where:{id:att.id}, data:update });
    }
    return NextResponse.json({ success:true, data:att });
  }catch(e:any){ return NextResponse.json({error:e.message},{status:500});}
}

