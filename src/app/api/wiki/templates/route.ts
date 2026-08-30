// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";

const TEMPLATES = [
  { id:"sop", name:"SOP", title:"Standard Operating Procedure", content:`<h1>Standard Operating Procedure</h1><h2>Purpose</h2><p>Describe purpose...</p><h2>Scope</h2><p>...</p><h2>Steps</h2><ol><li>Step 1</li><li>Step 2</li></ol><h2>Roles</h2><p>...</p>`, icon:"📄" },
  { id:"project-doc", name:"Project Documentation", title:"Project Documentation", content:`<h1>Project: [Name]</h1><h2>Overview</h2><p>...</p><h2>Goals</h2><p>...</p><h2>Milestones</h2><ul><li>Milestone 1</li></ul>`, icon:"📁" },
  { id:"meeting-notes", name:"Meeting Notes", title:"Meeting Notes", content:`<h1>Meeting Notes — {{date}}</h1><h2>Attendees</h2><p>...</p><h2>Agenda</h2><ul><li>Item 1</li></ul><h2>Decisions</h2><p>...</p><h2>Action Items</h2><ul><li>[] Task</li></ul>`, icon:"📝" },
  { id:"incident", name:"Incident Report", title:"Incident Report", content:`<h1>Incident Report</h1><h2>Summary</h2><p>...</p><h2>Timeline</h2><p>...</p><h2>Root Cause</h2><p>...</p><h2>Fix</h2><p>...</p>`, icon:"🚨" },
  { id:"onboarding", name:"Onboarding Guide", title:"Onboarding Guide", content:`<h1>Onboarding Guide</h1><h2>Welcome</h2><p>...</p><h2>Setup</h2><ul><li>Account</li><li>Tools</li></ul>`, icon:"👋" },
  { id:"troubleshooting", name:"Troubleshooting Guide", title:"Troubleshooting Guide", content:`<h1>Troubleshooting: [Issue]</h1><h2>Symptoms</h2><p>...</p><h2>Diagnosis</h2><p>...</p><h2>Solution</h2><p>...</p>`, icon:"🔧" },
  { id:"policy", name:"Policy", title:"Policy", content:`<h1>Policy: [Name]</h1><h2>Purpose</h2><p>...</p><h2>Policy</h2><p>...</p><h2>Enforcement</h2><p>...</p>`, icon:"📜" },
  { id:"faq", name:"FAQ", title:"FAQ", content:`<h1>FAQ</h1><h2>Q: Question?</h2><p>A: Answer</p>`, icon:"❓" },
];

export async function GET(){
  return NextResponse.json({ data: TEMPLATES });
}

export async function POST(req:NextRequest){
  try{
    const { templateId, title } = await req.json();
    const tmpl = TEMPLATES.find(t=> t.id===templateId);
    if(!tmpl) return NextResponse.json({ error:"Template not found" }, {status:404});
    // In real app, create document via /api/documents
    return NextResponse.json({ success:true, data: { title: title||tmpl.title, content: tmpl.content, name: tmpl.name }});
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}
