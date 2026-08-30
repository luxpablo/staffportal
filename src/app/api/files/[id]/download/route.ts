// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStorageProvider } from "@/lib/storage";

export async function GET(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const file = await prisma.file.findUnique({ where:{ id: params.id }});
    if(!file || file.deletedAt) return NextResponse.json({ error:"File not found" }, {status:404});
    // Strict access check
    if(file.visibility==="PRIVATE" && file.uploadedById!==user.id){
      // Check if user is founder or has manage permission
      const isFounder = user.role?.name==="SUPER_ADMIN" || user.role?.name==="Founder";
      if(!isFounder) return NextResponse.json({ error:"Forbidden: private file" }, {status:403});
    }
    if(file.departmentId && file.departmentId!==user.departmentId){
      const level = user.role?.name==="SUPER_ADMIN" ? 100 : 0;
      if(level < 50) return NextResponse.json({ error:"Forbidden: department file" }, {status:403});
    }
    if(file.status==="QUARANTINED") return NextResponse.json({ error:"File quarantined — malware detected" }, {status:403});
    if(file.status==="DELETED") return NextResponse.json({ error:"File deleted" }, {status:410});
    const storage = getStorageProvider();
    const buffer = await storage.get(file.storageKey);
    // Audit download
    try{ await prisma.auditLog.create({ data:{ userId: user.id, action:"File downloaded", entity:"File", entityId: file.id }}); }catch{}
    return new NextResponse(buffer, {
      headers:{
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${file.originalName}"`,
        "Content-Length": String(buffer.length),
      }
    });
  }catch(e:any){
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
