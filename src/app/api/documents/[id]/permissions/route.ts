// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user=await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const doc=await prisma.document.findUnique({ where:{ id: params.id }});
    if(!doc) return NextResponse.json({ error:"Not found" }, {status:404});
    // Check if user can view permissions
    if(doc.ownerId!==user.id && user.role?.name!=="SUPER_ADMIN"){
      const perm=await prisma.documentPermission.findFirst({ where:{ documentId: doc.id, userId: user.id }});
      if(!perm) return NextResponse.json({ error:"Forbidden" }, {status:403});
    }
    const perms=await prisma.documentPermission.findMany({ where:{ documentId: params.id }, include:{ user:{select:{name:true}}, grantedBy:{select:{name:true}} }});
    return NextResponse.json({ data: perms });
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}

export async function POST(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user=await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const doc=await prisma.document.findUnique({ where:{ id: params.id }});
    if(!doc) return NextResponse.json({ error:"Not found" }, {status:404});
    // Only owner or MANAGE_PERMISSIONS can grant
    if(doc.ownerId!==user.id && user.role?.name!=="SUPER_ADMIN"){
      const myPerm=await prisma.documentPermission.findFirst({ where:{ documentId: doc.id, userId: user.id, permission:"MANAGE_PERMISSIONS" }});
      if(!myPerm) return NextResponse.json({ error:"Forbidden: cannot grant" }, {status:403});
    }
    const { userId, departmentId, workspaceId, permission } = await req.json();
    if(!permission) return NextResponse.json({ error:"permission required" }, {status:400});
    // Prevent privilege escalation: cannot grant beyond own authority
    if(doc.visibility==="OWNER_ONLY" && user.role?.name!=="SUPER_ADMIN"){
      return NextResponse.json({ error:"Forbidden: cannot share OWNER_ONLY document" }, {status:403});
    }
    const perm=await prisma.documentPermission.create({
      data:{ documentId: params.id, userId: userId||null, departmentId: departmentId||null, workspaceId: workspaceId||null, permission: permission||"VIEW", grantedById: user.id }
    });
    try{ await prisma.auditLog.create({ data:{ userId: user.id, action:"Document permission granted", entity:"DocumentPermission", entityId: perm.id, newValue:{ documentId: params.id, permission } }}); }catch{}
    return NextResponse.json({ success:true, data: perm }, {status:201});
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}

export async function DELETE(req:NextRequest, {params}:{params:{id:string}}){
  try{
    const user=await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const { searchParams } = new URL(req.url);
    const permId=searchParams.get("id");
    if(!permId) return NextResponse.json({ error:"id required" }, {status:400});
    const perm=await prisma.documentPermission.findUnique({ where:{ id: permId }});
    if(!perm || perm.documentId!==params.id) return NextResponse.json({ error:"Not found" }, {status:404});
    const doc=await prisma.document.findUnique({ where:{ id: params.id }});
    if(doc?.ownerId!==user.id && user.role?.name!=="SUPER_ADMIN") return NextResponse.json({ error:"Forbidden" }, {status:403});
    await prisma.documentPermission.delete({ where:{ id: permId }});
    return NextResponse.json({ success:true });
  }catch(e:any){ return NextResponse.json({ error:e.message }, {status:500}); }
}
