// @ts-nocheck
import { NextResponse } from "next/server";
export async function POST(){
  const res = NextResponse.json({success:true});
  res.cookies.set("zyphron_token","",{maxAge:0, path:"/"});
  return res;
}
export async function GET(){ return POST(); }

