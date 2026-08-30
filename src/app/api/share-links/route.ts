// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req:NextRequest){
  try{
    const user=await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const { fileId, documentId, permission, expiresIn, password, downloadAllowed } = await req.json();
    if(!fileId && !documentId) return NextResponse.json({ error:"fileId or documentId required" }, {status:400});
    // Check access to file/document
    if(fileId){
      const f=await prisma.file.findUnique({ where:{ id: fileId }});
      if(!f) return NextResponse.json({ error:"File not found" }, {status:404});
      if(f.visibility==="PRIVATE" && f.uploadedById!==user.id && user.role?.name!=="SUPER_ADMIN") return NextResponse.json({ error:"Forbidden" }, {status:403});
    }
    if(documentId){
      const d=await prisma.document.findUnique({ where:{ id: documentId }});
      if(!d) return NextResponse.json({ error:"Document not found" }, {status:404});
      if(d.visibility==="PRIVATE" && d.ownerId!==user.id && user.role?.name!=="SUPER_ADMIN") return NextResponse.json({ error:"Forbidden" }, {status:403});
    }
    const token=crypto.randomBytes(24).toString("hex");
    let passwordHash=null;
    if(password) passwordHash=await bcrypt.hash(password,10);
    let expiresAt=null;
    if(expiresIn){
      if(expiresIn==="1h") expiresAt=new Date(Date.now()+3600000);
      else if(expiresIn==="1d") expiresAt=new Date(Date.now()+86400000);
      else if(expiresIn==="7d") expiresAt=new Date(Date.now()+7*86400000);
      else if(expiresIn==="30d") expiresAt=new Date(Date.now()+30*86400000);
      else if(expiresIn!=="never") expiresAt=new Date(expiresIn);
    } else {
      expiresAt=new Date(Date.now()+7*86400000);
    }
    const link=await prisma.shareLink.create({
      data:{ token, fileId: fileId||null, documentId: documentId||null, createdById: user.id, permission: permission||"VIEW", expiresAt, passwordHash, downloadAllowed: downloadAllowed!==false }
    });
    try{ await prisma.auditLog.create({ data:{ userId: user.id, action:"Share link created", entity:"ShareLink", entityId: link.id, newValue:{ token: token.slice(0,8)+"..." } }}); }catch{}
    return NextResponse.json({ success:true, data:{ token, url:`/share/${token}`, expiresAt }}, {status:201});
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}

export async function GET(req:NextRequest){
  try{
    const user=await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const { searchParams } = new URL(req.url);
    const fileId=searchParams.get("fileId");
    const documentId=searchParams.get("documentId");
    const where:any={};
    if(fileId) where.fileId=fileId;
    if(documentId) where.documentId=documentId;
    const links=await prisma.shareLink.findMany({ where, orderBy:{ createdAt:"desc" }});
    return NextResponse.json({ data: links.map(l=> ({ id:l.id, token:l.token.slice(0,8)+"...", permission:l.permission, expiresAt:l.expiresAt, downloadAllowed:l.downloadAllowed, createdAt:l.createdAt }))});
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}
