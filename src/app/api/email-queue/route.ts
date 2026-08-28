// @ts-nocheck
import { NextResponse } from "next/server";
import { processQueueBatch } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function GET(){
  try{
    const pending = await prisma.emailQueue.count({ where:{ status:"Pending" }});
    const failed = await prisma.emailQueue.count({ where:{ status:"Failed" }});
    const sent = await prisma.emailQueue.count({ where:{ status:"Sent" }});
    return NextResponse.json({ pending, failed, sent });
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}
export async function POST(){
  try{
    await processQueueBatch(20);
    return NextResponse.json({ success:true, message:"Queue processed" });
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}
