// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getSmtpConfig, createTransporter, brandedHtml } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function POST(req:NextRequest){
  try{
    const { recipient, useQueue } = await req.json();
    if(!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)){
      return NextResponse.json({ error:"Valid recipient email required" }, {status:400});
    }
    const cfg = await getSmtpConfig();
    if(!cfg) return NextResponse.json({ error:"SMTP not configured — set host/port/credentials in /settings/email" }, {status:400});
    if(!cfg.host || !cfg.fromEmail) return NextResponse.json({ error:"Invalid SMTP configuration" }, {status:400});

    // If requested to test via queue, enqueue
    // Otherwise send directly and return real result
    const subject = "Zyphron Cloud — SMTP Test";
    const html = brandedHtml(`<h1 style="margin:0 0 12px;font-size:22px;color:#0f172a">SMTP Test Successful ✅</h1>
      <p style="color:#334155">This is a real test email from the Zyphron Cloud Staff Portal.</p>
      <p style="color:#334155">If you received this, your SMTP settings are correct.</p>
      <table style="margin:16px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;width:100%"><tr><td style="padding:12px 16px;font-size:13px;color:#334155">
        <div><strong>Host:</strong> ${cfg.host}:${cfg.port}</div>
        <div><strong>Encryption:</strong> ${cfg.encryption}</div>
        <div><strong>From:</strong> ${cfg.fromName} &lt;${cfg.fromEmail}&gt;</div>
        <div><strong>Time:</strong> ${new Date().toLocaleString("en-IN")}</div>
      </td></tr></table>
      <p><a href="${process.env.APP_URL||'https://zyphron.cloud'}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Open Portal</a></p>`, { preheader:"SMTP test — Zyphron Cloud" });

    try{
      const transporter = createTransporter(cfg);
      // verify first — gives clear auth/connection errors
      await transporter.verify();
      const info = await transporter.sendMail({
        from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
        to: recipient,
        subject,
        html,
        replyTo: cfg.replyTo||undefined,
      });
      // log as sent
      try{
        await prisma.emailQueue.create({
          data:{ recipient, subject, templateKey:"test_email", html, status:"Sent", sentAt: new Date(), attemptCount:1 }
        });
      }catch{}
      return NextResponse.json({ success:true, message:`Email sent to ${recipient}`, messageId: info.messageId });
    }catch(e:any){
      const raw = e.message||"Unknown error";
      // sanitize: never leak credentials
      let userMsg = "SMTP send failed";
      if(/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|timeout/i.test(raw)) userMsg = "SMTP connection failed — check host/port and firewall";
      else if(/Invalid login|535|authentication|auth/i.test(raw)) userMsg = "SMTP authentication failed — check username/password";
      else if(/certificate|self signed/i.test(raw)) userMsg = "TLS certificate error — try STARTTLS or valid cert";
      else userMsg = "SMTP error: " + raw.slice(0,300);
      try{
        await prisma.emailQueue.create({
          data:{ recipient, subject, templateKey:"test_email", html, status:"Failed", error: raw.slice(0,1000), attemptCount:1, failedAt: new Date() }
        });
      }catch{}
      return NextResponse.json({ error:userMsg, details: raw.slice(0,500) }, {status:500});
    }
  }catch(e:any){
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
