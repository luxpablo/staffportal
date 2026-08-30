// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireChannelAccess } from "@/lib/channelAuth";

export async function POST(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    await requireChannelAccess(user, params.id);
    const member = await prisma.channelMember.update({
      where:{ channelId_userId:{ channelId: params.id, userId: user.id } },
      data:{ lastReadAt: new Date() }
    });
    return NextResponse.json({ success:true, data: member });
  }catch(e:any){
    if(e.message?.includes("Forbidden")) return NextResponse.json({ error:e.message }, {status:403});
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
