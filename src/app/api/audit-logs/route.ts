// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(req:NextRequest){
  const page=parseInt(new URL(req.url).searchParams.get("page")||"1");
  try{
    const [data,total]=await Promise.all([
      prisma.auditLog.findMany({ orderBy:{createdAt:"desc"}, take:20, skip:(page-1)*20, include:{user:{select:{name:true}}}}),
      prisma.auditLog.count(),
    ]);
    return NextResponse.json({ data, total });
  }catch(e:any){ if(/Authentication failed|Can.t reach|P1001/i.test(e.message)){ return NextResponse.json({ data:[], total:0, _warning:"Database unreachable" }); } return NextResponse.json({error:e.message},{status:500});}
}

