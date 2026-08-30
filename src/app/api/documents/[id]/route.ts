// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function canAccessDoc(user:any, doc:any){
  if(doc.visibility==="COMPANY") return true;
  if(doc.visibility==="PRIVATE" && doc.ownerId!==user.id){
    const isFounder=user.role?.name==="SUPER_ADMIN";
    if(!isFounder){
      const perm=await prisma.documentPermission.findFirst({ where:{ documentId: doc.id, userId: user.id }});
      if(!perm) return false;
    }
  }
  if(doc.visibility==="DEPARTMENT" && doc.departmentId!==user.departmentId){
    const perm=await prisma.documentPermission.findFirst({ where:{ documentId: doc.id, userId: user.id }});
    if(!perm && user.role?.name!=="SUPER_ADMIN") return false;
  }
  return true;
}

export async function GET(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user=await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const doc=await prisma.document.findUnique({ where:{ id: params.id }, include:{ owner:{select:{name:true}}, folder:{select:{name:true}}, currentVersion:true, _count:{select:{versions:true}} }});
    if(!doc) return NextResponse.json({ error:"Not found" }, {status:404});
    if(!await canAccessDoc(user, doc)) return NextResponse.json({ error:"Forbidden" }, {status:403});
    // Track recently viewed
    try{ await prisma.recentlyViewed.create({ data:{ userId: user.id, documentId: doc.id }}); }catch{}
    return NextResponse.json({ data: doc });
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}

export async function PATCH(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user=await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const doc=await prisma.document.findUnique({ where:{ id: params.id }});
    if(!doc) return NextResponse.json({ error:"Not found" }, {status:404});
    if(doc.ownerId!==user.id && user.role?.name!=="SUPER_ADMIN"){
      const perm=await prisma.documentPermission.findFirst({ where:{ documentId: doc.id, userId: user.id, permission:{ in:["EDIT","MANAGE_PERMISSIONS"] }}});
      if(!perm) return NextResponse.json({ error:"Forbidden: cannot edit" }, {status:403});
    }
    const { title, content, changeSummary } = await req.json();
    // Create new version before update
    const lastVer = await prisma.documentVersion.findFirst({ where:{ documentId: doc.id }, orderBy:{ versionNumber:"desc" }});
    const nextNum=(lastVer?.versionNumber||0)+1;
    const ver=await prisma.documentVersion.create({
      data:{ documentId: doc.id, versionNumber: nextNum, content: content||doc.content, createdById: user.id, changeSummary: changeSummary||"Update" }
    });
    const updated=await prisma.document.update({
      where:{ id: params.id },
      data:{ ...(title?{title}:{}), ...(content?{content}:{}), currentVersionId: ver.id, updatedAt: new Date() }
    });
    try{ await prisma.auditLog.create({ data:{ userId: user.id, action:"Document edited", entity:"Document", entityId: doc.id, newValue:{ version: nextNum } }}); }catch{}
    return NextResponse.json({ success:true, data: updated, version: ver });
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}

export async function DELETE(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user=await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const doc=await prisma.document.findUnique({ where:{ id: params.id }});
    if(!doc) return NextResponse.json({ error:"Not found" }, {status:404});
    if(doc.ownerId!==user.id && user.role?.name!=="SUPER_ADMIN") return NextResponse.json({ error:"Forbidden" }, {status:403});
    await prisma.document.update({ where:{ id: params.id }, data:{ status:"ARCHIVED", archivedAt: new Date() }});
    try{ await prisma.auditLog.create({ data:{ userId: user.id, action:"Document archived", entity:"Document", entityId: doc.id }}); }catch{}
    return NextResponse.json({ success:true });
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}
