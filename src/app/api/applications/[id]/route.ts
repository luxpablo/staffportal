// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

export async function GET(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const app = await prisma.staffApplication.findUnique({ where:{ id: params.id }, include:{ answers:{ include:{ question:true } } }});
    if(!app) return NextResponse.json({ error:"Application not found" }, {status:404});
    return NextResponse.json({ data: app });
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}

export async function PATCH(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const body = await req.json();
    const { status, reviewNotes, reviewedBy } = body;
    if(!status) return NextResponse.json({ error:"status required" }, {status:400});
    const allowed = ["Pending","Under Review","Approved","Rejected","Withdrawn"];
    if(!allowed.includes(status)) return NextResponse.json({ error:`Invalid status — allowed: ${allowed.join(", ")}` }, {status:400});
    const existing = await prisma.staffApplication.findUnique({ where:{ id: params.id }});
    if(!existing) return NextResponse.json({ error:"Application not found" }, {status:404});
    const updated = await prisma.staffApplication.update({
      where:{ id: params.id },
      data:{ status, reviewNotes: reviewNotes||null, reviewedBy: reviewedBy||null, reviewedAt: new Date() }
    });
    try{ await auditLog({ action:`Application ${status}`, entity:"StaffApplication", entityId: params.id, oldValue:{ status: existing.status }, newValue:{ status } }); }catch{}
    // If approved, optionally create in-app notification/email
    if(status==="Approved" || status==="Rejected"){
      try{
        const { enqueueEmail } = await import("@/lib/email");
        await enqueueEmail({
          recipient: existing.email,
          subject: status==="Approved" ? `Application Approved — ${existing.applicationId}` : `Application Update — ${existing.applicationId}`,
          templateKey: status==="Approved" ? "staff_welcome" : "staff_suspended",
          relatedEntity:"StaffApplication", relatedId: existing.id,
          vars:{ staff_name: existing.name, staff_email: existing.email, company_name:"Zyphron Cloud", login_url: process.env.APP_URL||"http://localhost:3000/login" }
        });
      }catch{}
    }
    return NextResponse.json({ success:true, data: updated });
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}

export async function DELETE(req:NextRequest, {params}:{params:{id:string}}){
  try{
    await prisma.staffApplication.delete({ where:{ id: params.id }});
    try{ await auditLog({ action:"Application deleted", entity:"StaffApplication", entityId: params.id }); }catch{}
    return NextResponse.json({ success:true });
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}
