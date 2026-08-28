// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(){
  try{
    const data=await prisma.department.findMany({ include:{ _count:{select:{members:true, tasks:true}}}, orderBy:{name:"asc"}});
    return NextResponse.json({ data });
  }catch(e:any){ if(/Authentication failed|Can.t reach|P1001/i.test(e.message)){ return NextResponse.json({ data:[], total:0, _warning:"Database unreachable" }); } return NextResponse.json({error:e.message},{status:500});}
}
export async function POST(req:NextRequest){
  const body=await req.json();
  const { name, description, budget, color } = body;
  if(!name) return NextResponse.json({error:"Name required"},{status:400});
  try{
    const dept=await prisma.department.create({ data:{ name, slug: name.toLowerCase().replace(/\s+/g,"-"), description, budget: budget||0, color: color||"#0ea5e9" }});
    return NextResponse.json({ success:true, data:dept }, {status:201});
  }catch(e:any){ return NextResponse.json({error:e.message},{status:500});}
}

