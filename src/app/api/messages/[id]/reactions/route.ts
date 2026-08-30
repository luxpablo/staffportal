// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireChannelAccess } from "@/lib/channelAuth";

export async function POST(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const msg = await prisma.message.findUnique({ where:{ id: params.id }});
    if(!msg) return NextResponse.json({ error:"Message not found" }, {status:404});
    await requireChannelAccess(user, msg.channelId);
    const { emoji } = await req.json();
    if(!emoji) return NextResponse.json({ error:"emoji required" }, {status:400});
    // Rate limiting: max 20 reactions per minute per user (simplified)
    const recent = await prisma.reaction.count({ where:{ userId: user.id, createdAt:{ gte: new Date(Date.now()-60000) } }});
    if(recent>20) return NextResponse.json({ error:"Rate limited" }, {status:429});
    const reaction = await prisma.reaction.create({ data:{ messageId: params.id, userId: user.id, emoji }});
    return NextResponse.json({ success:true, data: reaction }, {status:201});
  }catch(e:any){
    if(e.code==="P2002") return NextResponse.json({ error:"Already reacted" }, {status:409});
    if(e.message?.includes("Forbidden")) return NextResponse.json({ error:e.message }, {status:403});
    return NextResponse.json({ error:e.message }, {status:500});
  }
}

export async function DELETE(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const msg = await prisma.message.findUnique({ where:{ id: params.id }});
    if(!msg) return NextResponse.json({ error:"Message not found" }, {status:404});
    await requireChannelAccess(user, msg.channelId);
    const { searchParams } = new URL(req.url);
    const emoji = searchParams.get("emoji") || (await req.json().catch(()=>({}))).emoji;
    if(!emoji) return NextResponse.json({ error:"emoji required" }, {status:400});
    await prisma.reaction.delete({ where:{ messageId_userId_emoji:{ messageId: params.id, userId: user.id, emoji } }});
    return NextResponse.json({ success:true });
  }catch(e:any){
    return NextResponse.json({ error:e.message }, {status:500});
  }
}

export async function GET(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const msg = await prisma.message.findUnique({ where:{ id: params.id }});
    if(!msg) return NextResponse.json({ error:"Message not found" }, {status:404});
    await requireChannelAccess(user, msg.channelId);
    const reactions = await prisma.reaction.findMany({ where:{ messageId: params.id }, include:{ user:{select:{name:true}} }});
    // Group by emoji
    const grouped = reactions.reduce((acc:any, r:any)=>{
      if(!acc[r.emoji]) acc[r.emoji]={ emoji:r.emoji, count:0, users:[] };
      acc[r.emoji].count++;
      acc[r.emoji].users.push(r.user.name);
      return acc;
    },{});
    return NextResponse.json({ data: Object.values(grouped) });
  }catch(e:any){
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
