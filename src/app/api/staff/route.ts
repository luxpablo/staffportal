// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { auditLog } from "@/lib/audit";

export async function GET(req:NextRequest){
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")||"";
  const status = searchParams.get("status");
  const department = searchParams.get("department");
  const page = parseInt(searchParams.get("page")||"1");
  const limit = Math.min(parseInt(searchParams.get("limit")||"20"),100);
  const skip = (page-1)*limit;
  try{
    const where:any={};
    if(search) where.OR=[{name:{contains:search,mode:"insensitive"}},{email:{contains:search,mode:"insensitive"}},{username:{contains:search,mode:"insensitive"}}];
    if(status) where.status=status;
    if(department) where.departmentId=department;
    const [data, total] = await Promise.all([
      prisma.user.findMany({ where, include:{ role:true, department:true }, orderBy:{createdAt:"desc"}, skip, take:limit }),
      prisma.user.count({where}),
    ]);
    return NextResponse.json({ data, total, page, limit });
  }catch(e:any){ if(/Authentication failed|Can.t reach|P1001/i.test(e.message)){ return NextResponse.json({ data:[], total:0, _warning:"Database unreachable" }); } return NextResponse.json({error:e.message},{status:500});}
}

export async function POST(req:NextRequest){
  try{
    const body=await req.json();
    const { name, email, username, password, roleId, departmentId, status } = body;
    if(!name||!email||!username||!password) return NextResponse.json({error:"Missing fields"},{status:400});
    const hashed=await hashPassword(password);
    const employeeId = `ZYP-${Date.now().toString().slice(-6)}`;
    const user=await prisma.user.create({ data:{ name, email, username, password:hashed, employeeId, roleId: roleId||null, departmentId: departmentId||null, status:status||"Active" }});
    await auditLog({ action:"Staff created", entity:"User", entityId:user.id, newValue: { name, email, username, roleId, departmentId } });
    await prisma.notification.create({ data:{ userId:user.id, title:"Welcome to Zyphron Cloud", message:"Your account has been created. Please complete onboarding." }});
    // Real email — queued, non-blocking
    try{
      const { enqueueEmail } = await import("@/lib/email");
      await enqueueEmail({
        recipient: email,
        subject: `Welcome to Zyphron Cloud, ${name}!`,
        templateKey: "staff_welcome",
        relatedEntity:"User", relatedId: user.id,
        vars:{ staff_name: name, staff_email: email, login_url: process.env.APP_URL||"http://localhost:3000/login", company_name:"Zyphron Cloud" }
      });
    }catch{}
    return NextResponse.json({ success:true, data:user }, {status:201});
  }catch(e:any){
    if(e.code==="P2002") return NextResponse.json({error:"Email or username already exists"},{status:409});
    return NextResponse.json({error:e.message},{status:500});
  }
}

