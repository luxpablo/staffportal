// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function slugify(s:string){
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60) || "doc";
}

export async function GET(req:NextRequest){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")||"";
    const folderId = searchParams.get("folderId");
    const type = searchParams.get("type");
    const where:any={};
    if(search) where.OR=[{title:{contains:search,mode:"insensitive"}},{description:{contains:search,mode:"insensitive"}}];
    if(folderId) where.folderId=folderId;
    if(type) where.documentType=type;
    let docs = await prisma.document.findMany({ where, include:{ owner:{select:{name:true}}, folder:{select:{name:true}}, _count:{select:{versions:true}} }, orderBy:{ updatedAt:"desc" }, take:50 });
    // Permission filter
    const filtered=[];
    for(const d of docs){
      if(d.visibility==="PRIVATE" && d.ownerId!==user.id){
        const isFounder = user.role?.name==="SUPER_ADMIN";
        if(!isFounder){
          const perm = await prisma.documentPermission.findFirst({ where:{ documentId: d.id, userId: user.id }});
          if(!perm) continue;
        }
      }
      if(d.visibility==="DEPARTMENT" && d.departmentId && d.departmentId!==user.departmentId){
        const perm = await prisma.documentPermission.findFirst({ where:{ documentId: d.id, userId: user.id }});
        if(!perm && user.role?.name!=="SUPER_ADMIN") continue;
      }
      filtered.push(d);
    }
    return NextResponse.json({ data: filtered });
  }catch(e:any){
    if(/Authentication failed|Can't reach|P1001/i.test(e.message)){
      return NextResponse.json({ data:[], _warning:"Database unreachable" });
    }
    return NextResponse.json({ error:e.message }, {status:500});
  }
}

export async function POST(req:NextRequest){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const { title, description, content, documentType, folderId, workspaceId, departmentId, visibility } = await req.json();
    if(!title?.trim()) return NextResponse.json({ error:"title required" }, {status:400});
    let slug = slugify(title);
    // Ensure unique
    let candidate=slug, i=1;
    while(await prisma.document.findUnique({ where:{ slug: candidate }})){
      candidate=`${slug}-${i++}`;
    }
    const doc = await prisma.document.create({
      data:{
        title: title.trim(), slug: candidate, description: description||null, content: content||"", documentType: documentType||"WIKI",
        ownerId: user.id, workspaceId: workspaceId||null, departmentId: departmentId||null, folderId: folderId||null,
        visibility: visibility||"PRIVATE", status:"DRAFT"
      }
    });
    // Create initial version
    const ver = await prisma.documentVersion.create({
      data:{ documentId: doc.id, versionNumber:1, content: content||"", createdById: user.id, changeSummary:"Initial version" }
    });
    await prisma.document.update({ where:{ id: doc.id }, data:{ currentVersionId: ver.id }});
    try{ await prisma.auditLog.create({ data:{ userId: user.id, action:"Document created", entity:"Document", entityId: doc.id }}); }catch{}
    return NextResponse.json({ success:true, data: doc }, {status:201});
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}
