// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(req:NextRequest){
  const limit=parseInt(new URL(req.url).searchParams.get("limit")||"20");
  try{
    const data=await prisma.notification.findMany({ orderBy:{createdAt:"desc"}, take:limit });
    return NextResponse.json({ data });
  }catch(e:any){ if(/Authentication failed|Can.t reach|P1001/i.test(e.message)){ return NextResponse.json({ data:[], total:0, _warning:"Database unreachable" }); } return NextResponse.json({error:e.message},{status:500});}
}

