import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main(){
  const hashed = await bcrypt.hash("Admin@123", 10);

  // Roles
  const permissions = [
    {key:"staff:read",label:"View Staff",group:"staff"},
    {key:"staff:create",label:"Create Staff",group:"staff"},
    {key:"task:create",label:"Create Task",group:"tasks"},
    {key:"task:assign",label:"Assign Task",group:"tasks"},
    {key:"payout:create",label:"Create Payout",group:"payouts"},
    {key:"payout:approve",label:"Approve Payout",group:"payouts"},
  ];
  for(const p of permissions){
    await prisma.permission.upsert({ where:{key:p.key}, update:{}, create:p });
  }

  const roles = [
    {name:"SUPER_ADMIN", slug:"super_admin", description:"Full access", isSystem:true},
    {name:"ADMIN", slug:"admin", description:"Admin access", isSystem:true},
    {name:"HR_MANAGER", slug:"hr_manager", description:"HR", isSystem:false},
    {name:"MANAGER", slug:"manager", description:"Manager", isSystem:false},
    {name:"TEAM_LEAD", slug:"team_lead", description:"Team lead", isSystem:false},
    {name:"STAFF", slug:"staff", description:"Staff", isSystem:true},
    {name:"FINANCE", slug:"finance", description:"Finance", isSystem:false},
  ];
  for(const r of roles){
    await prisma.role.upsert({ where:{slug:r.slug}, update:{}, create:r });
  }
  const superAdminRole = await prisma.role.findUnique({ where:{ slug:"super_admin"}});

  // Departments
  const depts = ["Development","Support","Sales","Marketing","Finance","HR","Infrastructure","Moderation","Design","Management"];
  for(const name of depts){
    await prisma.department.upsert({ where:{slug:name.toLowerCase()}, update:{}, create:{ name, slug:name.toLowerCase(), description:`${name} department`, color:"#0ea5e9" }});
  }
  const devDept = await prisma.department.findUnique({ where:{ slug:"development"}});

  // Super Admin user — ONLY system user, no fake staff/payouts/tasks
  // In production, run `npx prisma db seed` manually; never auto-seed on deploy
  await prisma.user.upsert({
    where:{ email:"admin@zyphron.cloud"},
    update:{},
    create:{
      email:"admin@zyphron.cloud",
      username:"admin",
      name:"Zyphron Admin",
      password:hashed,
      employeeId:"ZYP-000",
      roleId: superAdminRole?.id,
      departmentId: devDept?.id,
      status:"Active",
      emailVerified:true,
    }
  });

  // Integrations placeholder
  for(const name of ["discord","smtp","whmcs","paymenter","pterodactyl"]){
    await prisma.integration.upsert({ where:{name}, update:{}, create:{ name, config:{}, isActive:false }});
  }

  // Email templates — real, not mock
  const templates = [
    { key:"staff_welcome", name:"Staff — Welcome", subject:"Welcome to Zyphron Cloud, {{staff_name}}!", htmlBody:`<h1 style="margin:0 0 8px;font-size:22px;color:#0f172a">Welcome, {{staff_name}} 👋</h1><p>Your staff account has been created.</p><p><strong>Email:</strong> {{staff_email}}<br><strong>Login:</strong> <a href="{{login_url}}" style="color:#2563eb">{{login_url}}</a></p>`, variables:["staff_name","staff_email","login_url","company_name"] },
    { key:"task_assigned", name:"Task — Assigned", subject:"New task assigned: {{task_title}}", htmlBody:`<h1>New task assigned</h1><p><strong>{{task_title}}</strong> has been assigned to you.</p><p>Deadline: {{task_deadline}} • Reward: {{task_reward}}</p>`, variables:["staff_name","task_title","task_deadline","task_reward","login_url"] },
    { key:"task_approved", name:"Task — Approved", subject:"Task approved: {{task_title}}", htmlBody:`<h1>Task Approved ✅</h1><p>Your task <strong>{{task_title}}</strong> was approved.</p>`, variables:["staff_name","task_title","payout_amount"] },
    { key:"task_rejected", name:"Task — Rejected", subject:"Task needs changes: {{task_title}}", htmlBody:`<h1>Changes Requested</h1><p>Your task <strong>{{task_title}}</strong> was rejected.</p>`, variables:["staff_name","task_title"] },
    { key:"payout_paid", name:"Payout — Paid", subject:"Payout {{payout_status}}: {{payout_amount}}", htmlBody:`<h1>Payout Update</h1><p>Your payout of <strong>{{payout_amount}}</strong> is now <strong>{{payout_status}}</strong>.</p>`, variables:["staff_name","payout_amount","payout_status"] },
    { key:"announcement", name:"Announcement — New", subject:"{{announcement_title}}", htmlBody:`<h1>{{announcement_title}}</h1><p>A new announcement was posted.</p>`, variables:["announcement_title","login_url","company_name"] },
    { key:"leave_decision", name:"Leave — Decision", subject:"Leave {{payout_status}}", htmlBody:`<h1>Leave Update</h1><p>Hi {{staff_name}}, your leave request has been {{payout_status}}.</p>`, variables:["staff_name","payout_status"] },
    { key:"performance_review", name:"Performance — Review", subject:"New performance review", htmlBody:`<h1>Performance Review</h1><p>Hi {{staff_name}}, a new performance review has been published.</p>`, variables:["staff_name"] },
    { key:"test_email", name:"Test Email", subject:"Zyphron Cloud — SMTP Test", htmlBody:`<h1>SMTP Test Successful ✅</h1><p>This is a test email from Zyphron Cloud Staff Portal.</p>`, variables:["company_name","login_url"] },
  ];
  for(const t of templates){
    await prisma.emailTemplate.upsert({ where:{ key:t.key }, update:{}, create:{ key:t.key, name:t.name, subject:t.subject, htmlBody:t.htmlBody, variables:t.variables, isEnabled:true, isSystem:true }});
  }
  const notifs = [
    {eventKey:"staff_welcome", label:"Staff — Welcome", description:"When a new staff account is created"},
    {eventKey:"task_assigned", label:"Task — Assigned", description:"When a task is assigned"},
    {eventKey:"task_approved", label:"Task — Approved", description:"When a task is approved"},
    {eventKey:"task_rejected", label:"Task — Rejected", description:"When a task is rejected"},
    {eventKey:"payout_paid", label:"Payout — Paid", description:"When a payout is marked paid"},
    {eventKey:"announcement", label:"Announcement", description:"New announcement published"},
    {eventKey:"leave_decision", label:"Leave — Decision", description:"Leave approved/rejected"},
    {eventKey:"performance_review", label:"Performance Review", description:"New performance review"},
  ];
  for(const n of notifs){
    await prisma.notificationSetting.upsert({ where:{ eventKey:n.eventKey }, update:{}, create:n });
  }

  console.log("Seed completed — email templates & notification settings seeded");
}
main().catch(e=>{ console.error(e); process.exit(1);}).finally(()=> prisma.$disconnect());
