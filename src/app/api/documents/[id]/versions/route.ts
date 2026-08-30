// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const doc = await prisma.document.findUnique({ where:{ id: params.id }});
    if(!doc) return NextResponse.json({ error:"Not found" }, {status:404});
    // Check access
    if(doc.visibility==="PRIVATE" && doc.ownerId!==user.id && user.role?.name!=="SUPER_ADMIN"){
      const perm=await prisma.documentPermission.findFirst({ where:{ documentId: doc.id, userId: user.id }});
      if(!perm) return NextResponse.json({ error:"Forbidden" }, {status:403});
    }
    const versions = await prisma.documentVersion.findMany({
      where:{ documentId: params.id },
      include:{ createdBy:{select:{name:true}} },
      orderBy:{ versionNumber:"desc" }
    });
    return NextResponse.json({ data: versions });
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}

export async function POST(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const doc = await prisma.document.findUnique({ where:{ id: params.id }});
    if(!doc) return NextResponse.json({ error:"Not found" }, {status:404});
    const { restoreId } = await req.json();
    if(!restoreId) return NextResponse.json({ error:"restoreId required" }, {status:400});
    const ver = await prisma.documentVersion.findUnique({ where:{ id: restoreId }});
    if(!ver || ver.documentId!==params.id) return NextResponse.json({ error:"Version not found" }, {status:404});
    // Restore: create new version with old content
    const last = await prisma.documentVersion.findFirst({ where:{ documentId: params.id }, orderBy:{ versionNumber:"desc" }});
    const nextNum=(last?.versionNumber||0)+1;
    const newVer = await prisma.documentVersion.create({
      data:{ documentId: params.id, versionNumber: nextNum, content: ver.content, createdById: user.id, changeSummary:`Restore from v${ver.versionNumber}` }
    });
    const updated = await prisma.document.update({ where:{ id: params.id }, data:{ content: ver.content, currentVersionId: newVer.id }});
    try{ await prisma.auditLog.create({ data:{ userId: user.id, action:"Document restored", entity:"Document", entityId: params.id, newValue:{ from: ver.versionNumber, to: nextNum } }}); }catch{}
    return NextResponse.json({ success:true, data: updated, version: newVer });
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}
