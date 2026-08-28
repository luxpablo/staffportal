// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(){
  try{
    const data=await prisma.announcement.findMany({ orderBy:{createdAt:"desc"}, take:20 });
    return NextResponse.json({ data });
  }catch(e:any){ if(/Authentication failed|Can.t reach|P1001/i.test(e.message)){ return NextResponse.json({ data:[], total:0, _warning:"Database unreachable" }); } return NextResponse.json({error:e.message},{status:500});}
}
export async function POST(req:NextRequest){
  const body=await req.json();
  const { title, content, priority }=body;
  if(!title||!content) return NextResponse.json({error:"Missing fields"},{status:400});
  try{
    const creator=await prisma.user.findFirst();
    if(!creator) return NextResponse.json({error:"No users in database"},{status:400});
    const ann=await prisma.announcement.create({ data:{ title, content, priority:priority||"General", createdById: creator.id }});
    // notify all staff via email (respect notification settings, queued)
    try{
      const staff = await prisma.user.findMany({ where:{ status:"Active" }, select:{ email:true, name:true }});
      const { enqueueEmail } = await import("@/lib/email");
      for(const u of staff){
        if(!u.email) continue;
        await enqueueEmail({
          recipient: u.email,
          subject: title,
          templateKey:"announcement",
          relatedEntity:"Announcement", relatedId: ann.id,
          vars:{ announcement_title: title, company_name:"Zyphron Cloud", login_url: process.env.APP_URL||"http://localhost:3000/login" }
        });
      }
    }catch{}
    return NextResponse.json({success:true,data:ann},{status:201});
  }catch(e:any){ return NextResponse.json({error:e.message},{status:500});}
}

