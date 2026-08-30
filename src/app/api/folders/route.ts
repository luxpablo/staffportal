// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req:NextRequest){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId");
    const where:any={};
    if(parentId) where.parentId=parentId;
    else where.parentId=null;
    let folders = await prisma.folder.findMany({ where, include:{ _count:{select:{files:true, documents:true, children:true}} }, orderBy:{ name:"asc" }});
    // Permission filter: private folders only owner or department
    const filtered=[];
    for(const f of folders){
      if(f.visibility==="PRIVATE" && f.ownerId!==user.id){
        const isFounder = user.role?.name==="SUPER_ADMIN";
        if(!isFounder) continue;
      }
      filtered.push(f);
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
    const { name, parentId, workspaceId, departmentId, visibility } = await req.json();
    if(!name?.trim()) return NextResponse.json({ error:"name required" }, {status:400});
    if(parentId){
      // Prevent circular: check parent exists and not self
      const parent = await prisma.folder.findUnique({ where:{ id: parentId }});
      if(!parent) return NextResponse.json({ error:"Parent not found" }, {status:404});
      // Simple circular check: parent cannot be descendant of new folder (new folder has no children yet, so ok)
    }
    const folder = await prisma.folder.create({
      data:{ name: name.trim(), parentId: parentId||null, ownerId: user.id, workspaceId: workspaceId||null, departmentId: departmentId||null, visibility: visibility||"PRIVATE" }
    });
    try{ await prisma.auditLog.create({ data:{ userId: user.id, action:"Folder created", entity:"Folder", entityId: folder.id, newValue:{ name } }}); }catch{}
    return NextResponse.json({ success:true, data: folder }, {status:201});
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}
