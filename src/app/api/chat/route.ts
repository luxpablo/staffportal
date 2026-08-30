// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req:NextRequest){
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const peerId = searchParams.get("peerId");
  const limit = Math.min(parseInt(searchParams.get("limit")||"50"),100);
  try{
    if(userId && peerId){
      const data = await prisma.chatMessage.findMany({
        where:{ OR:[{senderId:userId, recipientId:peerId},{senderId:peerId, recipientId:userId}] },
        orderBy:{ createdAt:"asc" },
        take: limit,
        include:{ sender:{select:{name:true}}, recipient:{select:{name:true}} }
      });
      return NextResponse.json({ data });
    }
    if(userId){
      const data = await prisma.chatMessage.findMany({
        where:{ OR:[{senderId:userId},{recipientId:userId}] },
        orderBy:{ createdAt:"desc" },
        take: limit,
        include:{ sender:{select:{name:true}}, recipient:{select:{name:true}} }
      });
      return NextResponse.json({ data });
    }
    const data = await prisma.chatMessage.findMany({ orderBy:{ createdAt:"desc" }, take: limit, include:{ sender:{select:{name:true}}, recipient:{select:{name:true}} }});
    return NextResponse.json({ data });
  }catch(e:any){
    if(/Authentication failed|Can't reach|P1001/i.test(e.message)){
      return NextResponse.json({ data:[], _warning:"Database unreachable" });
    }
    return NextResponse.json({error:e.message},{status:500});
  }
}

export async function POST(req:NextRequest){
  try{
    const { senderId, recipientId, content } = await req.json();
    if(!senderId || !recipientId || !content?.trim()) return NextResponse.json({error:"senderId, recipientId, content required"},{status:400});
    const msg = await prisma.chatMessage.create({ data:{ senderId, recipientId, content: content.trim() }});
    // notify recipient
    try{
      await prisma.notification.create({ data:{ userId: recipientId, title:`New message from ${senderId}`, message: content.slice(0,100), type:"chat" }});
    }catch{}
    return NextResponse.json({ success:true, data: msg }, {status:201});
  }catch(e:any){ return NextResponse.json({error:e.message},{status:500}); }
}
