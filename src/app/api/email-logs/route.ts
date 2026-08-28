// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req:NextRequest){
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // Pending, Sent, Failed, Processing
  const search = searchParams.get("search")||"";
  const page = parseInt(searchParams.get("page")||"1");
  const limit = Math.min(parseInt(searchParams.get("limit")||"20"),100);
  const skip=(page-1)*limit;
  try{
    const where:any={};
    if(status) where.status=status;
    if(search) where.OR=[{ recipient:{ contains:search, mode:"insensitive"}},{ subject:{ contains:search, mode:"insensitive"}},{ templateKey:{ contains:search, mode:"insensitive"}}];
    const [data, total] = await Promise.all([
      prisma.emailQueue.findMany({ where, orderBy:{ createdAt:"desc" }, skip, take: limit }),
      prisma.emailQueue.count({ where }),
    ]);
    // never expose html password etc — but html is ok; ensure no creds leak
    const sanitized = data.map(d=> ({
      id:d.id, recipient:d.recipient, subject:d.subject, templateKey:d.templateKey,
      status:d.status, attemptCount:d.attemptCount, error:d.error,
      relatedEntity:d.relatedEntity, relatedId:d.relatedId,
      sentAt:d.sentAt, failedAt:d.failedAt, createdAt:d.createdAt,
    }));
    return NextResponse.json({ data: sanitized, total, page, limit });
  }catch(e:any){
    if(/Authentication failed|Can't reach|P1001/i.test(e.message)){
      return NextResponse.json({ data:[], total:0, page, limit, _warning:"Database unreachable — configure DATABASE_URL" });
    }
    return NextResponse.json({ error:e.message }, {status:500});
  }
}

// retry failed
export async function POST(req:NextRequest){
  try{
    const { id, retryAll } = await req.json();
    if(retryAll){
      const res = await prisma.emailQueue.updateMany({ where:{ status:"Failed", attemptCount:{ lt:3 }}, data:{ status:"Pending", error: null }});
      // trigger processor
      const { processQueueBatch } = await import("@/lib/email");
      processQueueBatch(10).catch(()=>{});
      return NextResponse.json({ success:true, count: res.count });
    }
    if(!id) return NextResponse.json({ error:"id required" }, {status:400});
    await prisma.emailQueue.update({ where:{ id }, data:{ status:"Pending", error: null }});
    const { processQueueBatch } = await import("@/lib/email");
    processQueueBatch(5).catch(()=>{});
    return NextResponse.json({ success:true });
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}
