// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TEMPLATES, renderTemplate, brandedHtml } from "@/lib/email";

export async function GET(){
  try{
    // ensure defaults
    for(const t of DEFAULT_TEMPLATES){
      await prisma.emailTemplate.upsert({
        where:{ key:t.key },
        update:{},
        create:{ key:t.key, name:t.name, subject:t.subject, htmlBody:t.htmlBody, variables:t.variables, isEnabled:true, isSystem:true }
      });
    }
    const data = await prisma.emailTemplate.findMany({ orderBy:{ key:"asc" }});
    return NextResponse.json({ data });
  }catch(e:any){
    // DB unreachable — return defaults so UI can still preview (not fake business data, just system template definitions)
    if(/Authentication failed|Can't reach|P1001/i.test(e.message)){
      const data = DEFAULT_TEMPLATES.map(t=> ({ key:t.key, name:t.name, subject:t.subject, htmlBody:t.htmlBody, variables:t.variables, isEnabled:true, isSystem:true }));
      return NextResponse.json({ data, _fallback:true });
    }
    return NextResponse.json({ error:e.message }, {status:500});
  }
}

export async function PUT(req:NextRequest){
  try{
    const body = await req.json();
    const { key, subject, htmlBody, textBody, isEnabled, reset } = body;
    if(!key) return NextResponse.json({ error:"key required" }, {status:400});
    if(reset){
      const def = DEFAULT_TEMPLATES.find(d=> d.key===key);
      if(!def) return NextResponse.json({ error:"No default for key" }, {status:400});
      const row = await prisma.emailTemplate.update({ where:{ key }, data:{ subject: def.subject, htmlBody: def.htmlBody, isEnabled:true }});
      return NextResponse.json({ success:true, data: row });
    }
    const row = await prisma.emailTemplate.update({
      where:{ key },
      data:{
        ...(subject!==undefined ? { subject } : {}),
        ...(htmlBody!==undefined ? { htmlBody } : {}),
        ...(textBody!==undefined ? { textBody } : {}),
        ...(isEnabled!==undefined ? { isEnabled } : {}),
      }
    });
    return NextResponse.json({ success:true, data: row });
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}

// Preview — render with sample vars
export async function POST(req:NextRequest){
  try{
    const { key, vars, recipient } = await req.json();
    if(!key) return NextResponse.json({ error:"key required" }, {status:400});
    const tmpl = await prisma.emailTemplate.findUnique({ where:{ key }});
    if(!tmpl) return NextResponse.json({ error:"Template not found" }, {status:404});
    const sample: Record<string,string> = {
      staff_name:"Aarav Sharma",
      staff_email:"aarav@zyphron.cloud",
      task_title:"Deploy Pterodactyl template",
      task_deadline:new Date(Date.now()+3*86400000).toLocaleDateString("en-IN"),
      task_reward:"₹800",
      payout_amount:"₹5,000",
      payout_status:"Paid",
      announcement_title:"Maintenance window — 02:00 IST",
      company_name:"Zyphron Cloud",
      login_url: process.env.APP_URL||"http://localhost:3000/login",
      ...vars,
    };
    const subject = renderTemplate(tmpl.subject, sample);
    let html = renderTemplate(tmpl.htmlBody, sample);
    if(!html.includes("<html")) html = brandedHtml(html, { preheader: subject });
    // if recipient provided and we want to send test via queue
    if(recipient){
      const { enqueueEmail } = await import("@/lib/email");
      await enqueueEmail({ recipient, subject, html, templateKey: key, relatedEntity:"EmailTemplate", relatedId: key, vars: sample });
      return NextResponse.json({ success:true, preview:{ subject, html }, message:`Test email queued to ${recipient}` });
    }
    return NextResponse.json({ preview:{ subject, html }});
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}
