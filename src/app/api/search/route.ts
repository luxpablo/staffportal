// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req:NextRequest){
  try{
    const user = await getCurrentUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status:401});
    const q = new URL(req.url).searchParams.get("q")||"";
    if(q.length<2) return NextResponse.json({ data: { files:[], documents:[], wiki:[], staff:[], tasks:[] }});
    const search = q.trim();

    // Files — permission-aware
    let files = await prisma.file.findMany({ where:{ OR:[{name:{contains:search,mode:"insensitive"}},{originalName:{contains:search,mode:"insensitive"}}], deletedAt:null }, take:20 });
    files = files.filter(f=>{
      if(f.visibility==="COMPANY") return true;
      if(f.uploadedById===user.id) return true;
      if(f.visibility==="PRIVATE") return false;
      if(f.departmentId===user.departmentId) return true;
      return false;
    });

    // Documents — permission-aware
    let docs = await prisma.document.findMany({ where:{ OR:[{title:{contains:search,mode:"insensitive"}},{description:{contains:search,mode:"insensitive"}}] }, take:20 });
    const filteredDocs=[];
    for(const d of docs){
      if(d.visibility==="COMPANY"){ filteredDocs.push(d); continue; }
      if(d.visibility==="PRIVATE" && d.ownerId!==user.id){
        const perm=await prisma.documentPermission.findFirst({ where:{ documentId: d.id, userId: user.id }});
        if(!perm && user.role?.name!=="SUPER_ADMIN") continue;
      }
      if(d.visibility==="DEPARTMENT" && d.departmentId!==user.departmentId){
        const perm=await prisma.documentPermission.findFirst({ where:{ documentId: d.id, userId: user.id }});
        if(!perm && user.role?.name!=="SUPER_ADMIN") continue;
      }
      filteredDocs.push(d);
    }

    // Wiki is same as documents where documentType WIKI
    const wiki = filteredDocs.filter(d=> d.documentType==="WIKI");

    // Staff
    const staff = await prisma.user.findMany({ where:{ OR:[{name:{contains:search,mode:"insensitive"}},{email:{contains:search,mode:"insensitive"}}] }, take:10, select:{id:true,name:true,email:true,role:true} });

    // Tasks (only if user can access — for now all)
    const tasks = await prisma.task.findMany({ where:{ title:{contains:search,mode:"insensitive"} }, take:10, select:{id:true,title:true,status:true}});

    return NextResponse.json({ data:{ files: files.slice(0,5), documents: filteredDocs.slice(0,5), wiki: wiki.slice(0,5), staff: staff.slice(0,5), tasks: tasks.slice(0,5) }});
  }catch(e:any){
    if(/Authentication failed|Can't reach|P1001/i.test(e.message)){
      return NextResponse.json({ data:{ files:[], documents:[], wiki:[], staff:[], tasks:[] }, _warning:"Database unreachable" });
    }
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
