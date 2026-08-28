// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt, DEFAULT_TEMPLATES } from "@/lib/email";

// GET — never expose passwordEnc, return masked
export async function GET(){
  try{
    const row = await prisma.smtpSettings.findFirst({ orderBy:{ updatedAt:"desc" }});
    // also ensure templates & notification settings exist (lazy seed)
    const count = await prisma.emailTemplate.count();
    if(count===0){
      for(const t of DEFAULT_TEMPLATES){
        await prisma.emailTemplate.upsert({
          where:{ key:t.key },
          update:{},
          create:{ key:t.key, name:t.name, subject:t.subject, htmlBody:t.htmlBody, variables:t.variables, isEnabled:true, isSystem:true }
        });
      }
    }
    const notifCount = await prisma.notificationSetting.count();
    if(notifCount===0){
      const defaults = [
        {eventKey:"staff_welcome", label:"Staff — Welcome", description:"When a new staff account is created"},
        {eventKey:"task_assigned", label:"Task — Assigned", description:"When a task is assigned"},
        {eventKey:"task_approved", label:"Task — Approved", description:"When a task is approved"},
        {eventKey:"task_rejected", label:"Task — Rejected", description:"When a task is rejected"},
        {eventKey:"payout_paid", label:"Payout — Paid", description:"When a payout is marked paid"},
        {eventKey:"announcement", label:"Announcement", description:"New announcement published"},
        {eventKey:"leave_decision", label:"Leave — Decision", description:"Leave approved/rejected"},
        {eventKey:"performance_review", label:"Performance Review", description:"New performance review"},
      ];
      for(const n of defaults){
        await prisma.notificationSetting.upsert({ where:{eventKey:n.eventKey}, update:{}, create:n });
      }
    }

    if(!row){
      // return env-based config (masked) if no DB row
      const envExists = !!process.env.SMTP_HOST;
      return NextResponse.json({
        data: envExists ? {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT||"587"),
          username: process.env.SMTP_USER||"",
          passwordMasked: process.env.SMTP_PASSWORD ? "••••••••" : "",
          encryption: process.env.SMTP_SECURE==="true" ? "SSL" : "STARTTLS",
          fromName: process.env.SMTP_FROM_NAME||"Zyphron Cloud",
          fromEmail: process.env.SMTP_FROM_EMAIL||"no-reply@zyphron.cloud",
          replyTo: process.env.SMTP_REPLY_TO||"",
          isActive: true,
          source:"env",
        } : null
      });
    }
    return NextResponse.json({
      data:{
        id: row.id,
        host: row.host,
        port: row.port,
        username: row.username,
        passwordMasked: row.passwordEnc ? "••••••••" : "",
        hasPassword: !!row.passwordEnc,
        encryption: row.encryption,
        fromName: row.fromName,
        fromEmail: row.fromEmail,
        replyTo: row.replyTo||"",
        isActive: row.isActive,
        updatedAt: row.updatedAt,
        source:"db",
      }
    });
  }catch(e:any){
    // DB unreachable — return env fallback so UI can still preview
    if(/Authentication failed|Can't reach|P1001/i.test(e.message)){
      const envExists = !!process.env.SMTP_HOST;
      return NextResponse.json({
        data: envExists ? {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT||"587"),
          username: process.env.SMTP_USER||"",
          passwordMasked: process.env.SMTP_PASSWORD ? "••••••••" : "",
          encryption: process.env.SMTP_SECURE==="true" ? "SSL" : "STARTTLS",
          fromName: process.env.SMTP_FROM_NAME||"Zyphron Cloud",
          fromEmail: process.env.SMTP_FROM_EMAIL||"no-reply@zyphron.cloud",
          replyTo: process.env.SMTP_REPLY_TO||"",
          isActive: true,
          source:"env",
        } : null,
        _warning:"Database unreachable — showing env config. Configure DATABASE_URL."
      });
    }
    return NextResponse.json({ error:e.message }, {status:500});
  }
}

// POST — save (encrypt password, never log it)
export async function POST(req:NextRequest){
  try{
    const body = await req.json();
    const { host, port, username, password, encryption, fromName, fromEmail, replyTo } = body;
    if(!host || !port || !fromEmail) return NextResponse.json({ error:"host, port, fromEmail required" }, {status:400});
    // validate port
    const p = parseInt(String(port));
    if(isNaN(p) || p<1 || p>65535) return NextResponse.json({ error:"Invalid port" }, {status:400});
    // validate email
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) return NextResponse.json({ error:"Invalid fromEmail" }, {status:400});

    let passwordEnc: string | undefined;
    if(password && password!=="••••••••" && password!==""){
      passwordEnc = encrypt(password);
    }

    const existing = await prisma.smtpSettings.findFirst({ orderBy:{ updatedAt:"desc" }});
    let row;
    if(existing){
      row = await prisma.smtpSettings.update({
        where:{ id: existing.id },
        data:{
          host, port:p, username: username||"", ...(passwordEnc ? { passwordEnc } : {}),
          encryption: encryption||"STARTTLS", fromName: fromName||"Zyphron Cloud", fromEmail, replyTo: replyTo||null,
        }
      });
    } else {
      if(!passwordEnc) return NextResponse.json({ error:"SMTP password required" }, {status:400});
      row = await prisma.smtpSettings.create({
        data:{
          host, port:p, username: username||"", passwordEnc: passwordEnc!,
          encryption: encryption||"STARTTLS", fromName: fromName||"Zyphron Cloud", fromEmail, replyTo: replyTo||null,
        }
      });
    }
    // audit without password
    try{
      const { password: _pw, passwordEnc: _pe, ...safe } = body as any;
      await prisma.auditLog.create({ data:{ action:"SMTP settings updated", entity:"SmtpSettings", entityId: row.id, newValue: safe }});
    }catch{}
    return NextResponse.json({ success:true, data:{ id: row.id }});
  }catch(e:any){
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
