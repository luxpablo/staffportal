// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(){
  try{
    // lazy seed defaults if empty
    const count = await prisma.applicationQuestion.count();
    if(count===0){
      const defaults = [
        { question:"Why do you want to join Zyphron Cloud?", helpText:"Share your motivation in 2-3 sentences", type:"textarea", isRequired:true, sortOrder:1 },
        { question:"What relevant experience do you have? (Hosting / Support / Development)", helpText:"Briefly describe past roles or projects", type:"textarea", isRequired:true, sortOrder:2 },
        { question:"Which department are you most interested in?", helpText:"", type:"select", options:["Development","Support","Sales","Marketing","Finance","HR","Infrastructure","Moderation","Design","Management"], isRequired:true, sortOrder:3 },
        { question:"How many hours per week can you commit?", helpText:"e.g. 10, 20, 40", type:"select", options:["<10 hours","10-20 hours","20-30 hours","30-40 hours","40+ hours"], isRequired:true, sortOrder:4 },
        { question:"Do you have experience with Pterodactyl / WHMCS / Paymenter?", helpText:"Select all that apply or describe", type:"textarea", isRequired:false, sortOrder:5 },
        { question:"Discord username (for staff communication)", helpText:"e.g. username#1234", type:"text", isRequired:true, sortOrder:6 },
        { question:"How did you hear about Zyphron Cloud?", helpText:"", type:"select", options:["Discord","Website","Referral","Social Media","Other"], isRequired:false, sortOrder:7 },
        { question:"Anything else you want us to know?", helpText:"Optional", type:"textarea", isRequired:false, sortOrder:8 },
      ];
      for(const q of defaults){
        await prisma.applicationQuestion.create({ data: q });
      }
    }
    const data = await prisma.applicationQuestion.findMany({ where:{ isActive:true }, orderBy:{ sortOrder:"asc" }});
    return NextResponse.json({ data });
  }catch(e:any){
    // DB unreachable — return defaults so apply form can still render (no mock business data, just question definitions)
    if(/Authentication failed|Can't reach|P1001/i.test(e.message)){
      const fallback = [
        { id:"q1", question:"Why do you want to join Zyphron Cloud?", helpText:"Share your motivation", type:"textarea", isRequired:true, sortOrder:1, options:[], isActive:true },
        { id:"q2", question:"What relevant experience do you have?", helpText:"", type:"textarea", isRequired:true, sortOrder:2, options:[], isActive:true },
        { id:"q3", question:"Which department are you most interested in?", helpText:"", type:"select", options:["Development","Support","Sales"], isRequired:true, sortOrder:3, isActive:true },
      ];
      return NextResponse.json({ data: fallback, _fallback:true });
    }
    return NextResponse.json({ error:e.message }, {status:500});
  }
}

export async function POST(req:NextRequest){
  try{
    const body = await req.json();
    const { question, helpText, type, options, isRequired, sortOrder } = body;
    if(!question) return NextResponse.json({ error:"question required" }, {status:400});
    const row = await prisma.applicationQuestion.create({
      data:{ question, helpText: helpText||null, type: type||"textarea", options: options||[], isRequired: isRequired??true, sortOrder: sortOrder||0 }
    });
    return NextResponse.json({ success:true, data: row }, {status:201});
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}
