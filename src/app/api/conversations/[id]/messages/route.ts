// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const convo = await prisma.conversation.findUnique({ where:{ id: params.id }, include:{ members:true }});
    if(!convo) return NextResponse.json({ error:"Conversation not found" }, {status:404});
    if(!convo.members.some((m:any)=> m.userId===user.id)) return NextResponse.json({ error:"Forbidden: not a member" }, {status:403});
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit")||"50"),100);
    const cursor = searchParams.get("cursor");
    const messages = await prisma.directMessage.findMany({
      where:{ conversationId: params.id, deletedAt:null },
      include:{ author:{select:{name:true,avatar:true}}, reactions:{include:{user:{select:{name:true}}}} },
      orderBy:{ createdAt:"desc" },
      take: limit,
      ...(cursor?{ cursor:{ id: cursor }, skip:1 }:{}),
    });
    const reversed = messages.reverse();
    const nextCursor = messages.length===limit ? reversed[reversed.length-1]?.id : null;
    return NextResponse.json({ data: reversed, nextCursor, hasMore: messages.length===limit });
  }catch(e:any){
    if(e.message?.includes("Forbidden")) return NextResponse.json({ error:e.message }, {status:403});
    return NextResponse.json({ error:e.message }, {status:500});
  }
}

export async function POST(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const convo = await prisma.conversation.findUnique({ where:{ id: params.id }, include:{ members:true }});
    if(!convo) return NextResponse.json({ error:"Conversation not found" }, {status:404});
    if(!convo.members.some((m:any)=> m.userId===user.id)) return NextResponse.json({ error:"Forbidden: not a member" }, {status:403});
    const { content, type } = await req.json();
    if(!content?.trim()) return NextResponse.json({ error:"content required" }, {status:400});
    const msg = await prisma.directMessage.create({
      data:{ conversationId: params.id, authorId: user.id, content: content.trim(), type: type||"TEXT" },
      include:{ author:{select:{name:true}} }
    });
    await prisma.conversation.update({ where:{ id: params.id }, data:{ updatedAt: new Date() }});
    // Notify other members
    for(const m of convo.members){
      if(m.userId===user.id) continue;
      try{ await prisma.notification.create({ data:{ userId: m.userId, title:`DM from ${user.name}`, message: content.slice(0,80), type:"dm", link:`/channels/dm/${params.id}` }}); }catch{}
    }
    return NextResponse.json({ success:true, data: msg }, {status:201});
  }catch(e:any){
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
