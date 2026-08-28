import nodemailer from "nodemailer";
import crypto from "crypto";
import { prisma } from "./prisma";

const ALG = "aes-256-gcm";
function getKey(){
  const secret = process.env.AUTH_SECRET || "zyphron_dev_secret_32_chars_minimum!!";
  return crypto.createHash("sha256").update(secret).digest();
}
export function encrypt(text:string){
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALG, getKey(), iv);
  let enc = cipher.update(text,"utf8","hex");
  enc += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${tag}:${enc}`;
}
export function decrypt(enc:string){
  try{
    const [ivHex, tagHex, data] = enc.split(":");
    const decipher = crypto.createDecipheriv(ALG, getKey(), Buffer.from(ivHex,"hex"));
    decipher.setAuthTag(Buffer.from(tagHex,"hex"));
    let dec = decipher.update(data,"hex","utf8");
    dec += decipher.final("utf8");
    return dec;
  }catch{ return ""; }
}

export type SmtpConfig = {
  host:string; port:number; username:string; password:string; encryption:string; fromName:string; fromEmail:string; replyTo?:string;
};

export async function getSmtpConfig(): Promise<SmtpConfig | null>{
  // 1) DB first
  try{
    const row = await prisma.smtpSettings.findFirst({ where:{ isActive:true }, orderBy:{ updatedAt:"desc" }});
    if(row){
      return {
        host: row.host, port: row.port, username: row.username, password: decrypt(row.passwordEnc),
        encryption: row.encryption, fromName: row.fromName, fromEmail: row.fromEmail, replyTo: row.replyTo||undefined,
      };
    }
  }catch{}
  // 2) env fallback
  if(process.env.SMTP_HOST){
    return {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT||"587"),
      username: process.env.SMTP_USER||"",
      password: process.env.SMTP_PASSWORD||"",
      encryption: (process.env.SMTP_SECURE==="true" ? "SSL" : "STARTTLS"),
      fromName: process.env.SMTP_FROM_NAME||"Zyphron Cloud",
      fromEmail: process.env.SMTP_FROM_EMAIL||"no-reply@zyphron.cloud",
      replyTo: process.env.SMTP_REPLY_TO,
    };
  }
  return null;
}

export function createTransporter(cfg:SmtpConfig){
  const isSSL = cfg.encryption==="SSL";
  const isSTARTTLS = cfg.encryption==="STARTTLS";
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: isSSL, // true for 465
    requireTLS: isSTARTTLS,
    auth: cfg.username ? { user: cfg.username, pass: cfg.password } : undefined,
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

export async function verifySmtp(cfg:SmtpConfig){
  const transporter = createTransporter(cfg);
  await transporter.verify();
}

export function renderTemplate(str:string, vars: Record<string,string>){
  let out = str;
  for(const [k,v] of Object.entries(vars)){
    out = out.split(`{{${k}}}`).join(v ?? "");
    out = out.split(`{{ ${k} }}`).join(v ?? "");
  }
  return out;
}

export function brandedHtml(inner:string, opts?:{ preheader?:string }){
  const preheader = opts?.preheader || "";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Zyphron Cloud</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
        <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#2563eb 100%);padding:20px 28px">
          <table width="100%"><tr>
            <td><div style="display:inline-flex;align-items:center;gap:10px"><div style="width:36px;height:36px;border-radius:10px;background:#ffffff;color:#0f172a;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:14px">ZC</div><span style="color:#ffffff;font-weight:700;font-size:16px;letter-spacing:-0.02em">Zyphron Cloud</span></div></td>
            <td align="right"><span style="color:#cbd5e1;font-size:12px">zyphron.cloud</span></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:28px">
          <div style="color:#0f172a;font-size:14px;line-height:22px">${inner}</div>
        </td></tr>
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 28px">
          <div style="color:#64748b;font-size:12px;line-height:18px">
            <div style="font-weight:600;color:#334155">Zyphron Cloud — Staff Operations</div>
            <div>Need help? Contact <a href="mailto:support@zyphron.cloud" style="color:#2563eb;text-decoration:none">support@zyphron.cloud</a> • <a href="https://zyphron.cloud" style="color:#2563eb;text-decoration:none">zyphron.cloud</a></div>
            <div style="margin-top:8px"><a href="{{login_url}}" style="color:#64748b;text-decoration:underline">Manage notification preferences</a> • You’re receiving this because you’re part of Zyphron Cloud staff.</div>
          </div>
        </td></tr>
      </table>
      <div style="color:#94a3b8;font-size:11px;margin-top:12px">© ${new Date().getFullYear()} Zyphron Cloud. All rights reserved.</div>
    </td></tr>
  </table>
</body></html>`;
}

// Queue helpers — real DB queue, background processing via /api/cron or on-demand
export async function enqueueEmail(opts:{
  recipient:string; subject:string; templateKey?:string; html?:string; text?:string;
  relatedEntity?:string; relatedId?:string; vars?:Record<string,string>;
}){
  // Check notification settings
  if(opts.templateKey){
    try{
      const setting = await prisma.notificationSetting.findUnique({ where:{ eventKey: opts.templateKey }});
      if(setting && !setting.isEnabled) return null;
      if(setting && !setting.channelEmail) return null;
    }catch{}
  }
  // Resolve template if needed
  let html = opts.html;
  let subject = opts.subject;
  if(opts.templateKey && !html){
    const tmpl = await prisma.emailTemplate.findUnique({ where:{ key: opts.templateKey }});
    if(tmpl){
      if(!tmpl.isEnabled) return null;
      const vars = opts.vars||{};
      subject = renderTemplate(tmpl.subject, vars);
      html = renderTemplate(tmpl.htmlBody, vars);
      // wrap with branding if not already branded
      if(!html.includes("Zyphron Cloud") || !html.includes("<html")){
        html = brandedHtml(html, { preheader: subject });
      }
    }
  }
  if(html && !html.includes("<html")) html = brandedHtml(html);

  const row = await prisma.emailQueue.create({
    data:{
      recipient: opts.recipient,
      subject,
      templateKey: opts.templateKey,
      html: html||undefined,
      text: opts.text,
      relatedEntity: opts.relatedEntity,
      relatedId: opts.relatedId,
      status:"Pending",
    }
  });
  // Try immediate send (non-blocking) — but API returns quickly
  processQueueBatch().catch(()=>{});
  return row;
}

export async function processQueueBatch(limit=10){
  const cfg = await getSmtpConfig();
  if(!cfg) return;
  const pending = await prisma.emailQueue.findMany({
    where:{ status:{ in:["Pending","Failed"]}, attemptCount:{ lt: 3 }},
    orderBy:{ createdAt:"asc" },
    take: limit,
  });
  for(const item of pending){
    await prisma.emailQueue.update({ where:{id:item.id}, data:{ status:"Processing", attemptCount:{ increment:1 }}});
    try{
      const transporter = createTransporter(cfg);
      await transporter.sendMail({
        from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
        to: item.recipient,
        subject: item.subject,
        html: item.html||undefined,
        text: item.text||undefined,
        replyTo: cfg.replyTo || undefined,
      });
      await prisma.emailQueue.update({ where:{id:item.id}, data:{ status:"Sent", sentAt: new Date(), error: null }});
    }catch(e:any){
      const msg = e.message?.slice(0,1000) || "Unknown error";
      const isPermanent = /invalid|authentication|envelope|address/i.test(msg);
      await prisma.emailQueue.update({
        where:{id:item.id},
        data:{
          status: isPermanent || item.attemptCount+1>=3 ? "Failed" : "Pending",
          error: msg,
          failedAt: new Date(),
        }
      });
    }
  }
}

// Default templates seed helper
export const DEFAULT_TEMPLATES: Array<{key:string; name:string; subject:string; htmlBody:string; variables:string[]}> = [
  { key:"staff_welcome", name:"Staff — Welcome", subject:"Welcome to Zyphron Cloud, {{staff_name}}!", htmlBody:`<h1 style="margin:0 0 8px;font-size:22px;color:#0f172a">Welcome, {{staff_name}} 👋</h1><p>Your staff account has been created.</p><p><strong>Email:</strong> {{staff_email}}<br><strong>Login:</strong> <a href="{{login_url}}" style="color:#2563eb">{{login_url}}</a></p><p>Please complete onboarding and set your password.</p>`, variables:["staff_name","staff_email","login_url","company_name"] },
  { key:"staff_suspended", name:"Staff — Suspended", subject:"Your Zyphron Cloud account has been suspended", htmlBody:`<h1>Account Suspended</h1><p>Hi {{staff_name}}, your account ({{staff_email}}) has been suspended. Contact HR if this is unexpected.</p>`, variables:["staff_name","staff_email"] },
  { key:"task_assigned", name:"Task — Assigned", subject:"New task assigned: {{task_title}}", htmlBody:`<h1 style="margin:0 0 12px;font-size:20px">New task assigned</h1><p><strong>{{task_title}}</strong> has been assigned to you.</p><p>Deadline: {{task_deadline}} • Reward: {{task_reward}}</p><p><a href="{{login_url}}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none">View task</a></p>`, variables:["staff_name","task_title","task_deadline","task_reward","login_url"] },
  { key:"task_approved", name:"Task — Approved", subject:"Task approved: {{task_title}}", htmlBody:`<h1>Task Approved ✅</h1><p>Your task <strong>{{task_title}}</strong> was approved. Earnings of {{payout_amount}} will be credited.</p>`, variables:["staff_name","task_title","payout_amount"] },
  { key:"task_rejected", name:"Task — Rejected", subject:"Task needs changes: {{task_title}}", htmlBody:`<h1>Changes Requested</h1><p>Your task <strong>{{task_title}}</strong> was rejected. Please check comments and resubmit.</p>`, variables:["staff_name","task_title"] },
  { key:"payout_paid", name:"Payout — Paid", subject:"Payout {{payout_status}}: {{payout_amount}}", htmlBody:`<h1>Payout Update</h1><p>Your payout of <strong>{{payout_amount}}</strong> is now <strong>{{payout_status}}</strong>.</p><p>{{staff_name}}, funds will reflect per your payment method.</p>`, variables:["staff_name","payout_amount","payout_status"] },
  { key:"announcement", name:"Announcement — New", subject:"{{announcement_title}}", htmlBody:`<h1>{{announcement_title}}</h1><p>A new announcement was posted. Please review it in the portal.</p><p><a href="{{login_url}}" style="color:#2563eb">Open announcements</a></p>`, variables:["announcement_title","login_url","company_name"] },
  { key:"leave_decision", name:"Leave — Decision", subject:"Leave {{payout_status}}", htmlBody:`<h1>Leave Update</h1><p>Hi {{staff_name}}, your leave request has been {{payout_status}}.</p>`, variables:["staff_name","payout_status"] },
  { key:"performance_review", name:"Performance — Review", subject:"New performance review", htmlBody:`<h1>Performance Review</h1><p>Hi {{staff_name}}, a new performance review has been published. Check your portal.</p>`, variables:["staff_name"] },
  { key:"test_email", name:"Test Email", subject:"Zyphron Cloud — SMTP Test", htmlBody:`<h1>SMTP Test Successful ✅</h1><p>This is a test email from Zyphron Cloud Staff Portal.</p><p>If you received this, your SMTP settings are correct.</p><p><strong>Time:</strong> {{company_name}}</p>`, variables:["company_name","login_url"] },
];
