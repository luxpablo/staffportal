// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req:NextRequest){
  try{
    const user=await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    if(user.role?.name!=="SUPER_ADMIN" && user.role?.name!=="ADMIN") return NextResponse.json({ error:"Forbidden: admin only" }, {status:403});
    const totalFiles=await prisma.file.count();
    const totalDocs=await prisma.document.count();
    const totalFolders=await prisma.folder.count();
    const quarantined=await prisma.file.count({ where:{ status:"QUARANTINED" }});
    const failed=await prisma.file.count({ where:{ status:"FAILED" }});
    const totalSizeAgg=await prisma.file.aggregate({ _sum:{ size:true }});
    const largest=await prisma.file.findMany({ orderBy:{ size:"desc" }, take:5, select:{ name:true, size:true, mimeType:true }});
    const recentUploads=await prisma.file.findMany({ orderBy:{ createdAt:"desc" }, take:10, select:{ name:true, size:true, createdAt:true, uploadedBy:{select:{name:true}} }});
    return NextResponse.json({
      data:{
        totalFiles, totalDocs, totalFolders, quarantined, failed,
        totalSize: totalSizeAgg._sum.size||0,
        largest,
        recentUploads,
        storageProvider: process.env.STORAGE_PROVIDER||"local",
      }
    });
  }catch(e:any){
    if(/Authentication failed|Can't reach|P1001/i.test(e.message)){
      return NextResponse.json({ data:{ totalFiles:0, totalDocs:0, totalFolders:0, quarantined:0, failed:0, totalSize:0, largest:[], recentUploads:[], storageProvider:"local", _warning:"Database unreachable" }});
    }
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
