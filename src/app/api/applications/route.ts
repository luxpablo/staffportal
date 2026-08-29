// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

function genAppId(){
  const y=new Date().getFullYear();
  const r=Math.floor(1000+Math.random()*9000);
  return `APP-${y}-${r}`;
}

export async function GET(req:NextRequest){
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search")||"";
  const page = parseInt(searchParams.get("page")||"1");
  const limit = Math.min(parseInt(searchParams.get("limit")||"20"),100);
  const skip=(page-1)*limit;
  try{
    const where:any={};
    if(status) where.status=status;
    if(search) where.OR=[{ name:{ contains:search, mode:"insensitive"}},{ email:{ contains:search, mode:"insensitive"}},{ applicationId:{ contains:search, mode:"insensitive"}}];
    const [data, total] = await Promise.all([
      prisma.staffApplication.findMany({ where, include:{ answers:{ include:{ question:true } } }, orderBy:{ createdAt:"desc" }, skip, take: limit }),
      prisma.staffApplication.count({ where }),
    ]);
    return NextResponse.json({ data, total, page, limit });
  }catch(e:any){
    if(/Authentication failed|Can't reach|P1001/i.test(e.message)){
      return NextResponse.json({ data:[], total:0, page, limit, _warning:"Database unreachable" });
    }
    return NextResponse.json({ error:e.message }, {status:500});
  }
}

export async function POST(req:NextRequest){
  try{
    const body = await req.json();
    const { name, email, dob, phone, address, city, state, country, pincode, identityType, identityNumber, identityProofUrl, identityProofName, photoUrl, photoName, answers } = body;
    // Validate required personal details
    if(!name || !email || !dob || !phone || !address || !state || !country || !identityType || !identityNumber || !identityProofUrl || !photoUrl){
      return NextResponse.json({ error:"Missing required personal details — name, DOB, phone, address, state, country, identity proof and photo are all required" }, {status:400});
    }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error:"Invalid email" }, {status:400});
    if(!/^\+?[0-9\s\-()]{7,20}$/.test(phone)) return NextResponse.json({ error:"Invalid phone number" }, {status:400});
    const dobDate = new Date(dob);
    if(isNaN(dobDate.getTime())) return NextResponse.json({ error:"Invalid DOB" }, {status:400});
    const age = (Date.now()-dobDate.getTime())/(365.25*24*3600000);
    if(age<16) return NextResponse.json({ error:"Must be at least 16 years old" }, {status:400});
    if(age>80) return NextResponse.json({ error:"Invalid DOB" }, {status:400});

    // Validate questions required
    const questions = await prisma.applicationQuestion.findMany({ where:{ isActive:true, isRequired:true }});
    const answerMap = new Map((answers||[]).map((a:any)=> [a.questionId, a.answer]));
    for(const q of questions){
      const ans = answerMap.get(q.id);
      if(!ans || String(ans).trim()===""){
        return NextResponse.json({ error:`Missing required answer: ${q.question}` }, {status:400});
      }
    }

    const applicationId = genAppId();
    const app = await prisma.staffApplication.create({
      data:{
        applicationId, name, email, dob: dobDate, phone, address, city: city||null, state, country, pincode: pincode||null,
        identityType, identityNumber, identityProofUrl, identityProofName: identityProofName||null,
        photoUrl, photoName: photoName||null, status:"Pending",
      }
    });
    // Create answers
    if(answers?.length){
      for(const a of answers){
        if(!a.questionId || !a.answer) continue;
        await prisma.staffApplicationAnswer.create({
          data:{ applicationId: app.id, questionId: a.questionId, answer: String(a.answer) }
        });
      }
    }
    try{ await auditLog({ action:"Application submitted", entity:"StaffApplication", entityId: app.id, newValue:{ applicationId, name, email } }); }catch{}
    // Enqueue email to applicant + admin notification (optional)
    try{
      const { enqueueEmail } = await import("@/lib/email");
      await enqueueEmail({
        recipient: email,
        subject:`Application received — ${applicationId}`,
        templateKey:"staff_welcome",
        relatedEntity:"StaffApplication", relatedId: app.id,
        vars:{ staff_name: name, staff_email: email, company_name:"Zyphron Cloud", login_url: process.env.APP_URL||"http://localhost:3000/login" }
      });
    }catch{}

    return NextResponse.json({ success:true, data: app }, {status:201});
  }catch(e:any){
    if(e.code==="P2002") return NextResponse.json({ error:"Application with this email already exists or duplicate ID" }, {status:409});
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
