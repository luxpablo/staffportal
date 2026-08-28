// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(){
  try{
    const data = await prisma.notificationSetting.findMany({ orderBy:{ eventKey:"asc" }});
    return NextResponse.json({ data });
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}
export async function PUT(req:NextRequest){
  try{
    const { eventKey, channelEmail, channelInApp, isEnabled } = await req.json();
    if(!eventKey) return NextResponse.json({ error:"eventKey required" }, {status:400});
    const row = await prisma.notificationSetting.update({
      where:{ eventKey },
      data:{
        ...(channelEmail!==undefined?{ channelEmail }:{}),
        ...(channelInApp!==undefined?{ channelInApp }:{}),
        ...(isEnabled!==undefined?{ isEnabled }:{}),
      }
    });
    return NextResponse.json({ success:true, data: row });
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}
