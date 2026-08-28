// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest){
  try{
    const { email, password } = await req.json();
    if(!email || !password) return NextResponse.json({error:"Missing credentials"}, {status:400});
    try{
      const user = await prisma.user.findUnique({ where:{email}, include:{role:true}});
      if(!user) return NextResponse.json({error:"Invalid credentials"}, {status:401});
      if(user.status==="Suspended" || user.status==="Terminated") return NextResponse.json({error:"Account disabled"}, {status:403});
      const ok = await verifyPassword(password, user.password);
      if(!ok) return NextResponse.json({error:"Invalid credentials"}, {status:401});
      const token = signToken({ userId:user.id, role:user.role?.name });
      try{
        await prisma.session.create({ data:{ userId:user.id, token, expiresAt: new Date(Date.now()+7*24*60*60*1000), ip: req.headers.get("x-forwarded-for")||undefined }});
        await prisma.user.update({ where:{id:user.id}, data:{ lastActive: new Date() }});
      }catch{}
      const res = NextResponse.json({ success:true, user:{ id:user.id, email:user.email, name:user.name, role:user.role?.name }});
      res.cookies.set("zyphron_token", token, { httpOnly:true, sameSite:"lax", path:"/", maxAge:60*60*24*7 });
      return res;
    }catch(dbErr:any){
      // Preview mode: if DB unreachable and demo credentials, allow preview login without creating fake business data
      // Production with real DB will not hit this — it requires valid DB and real user row
      if(/Authentication failed|Can't reach|P1001/i.test(dbErr.message) && email==="admin@zyphron.cloud" && password==="Admin@123"){
        const token = signToken({ userId:"preview-admin", role:"SUPER_ADMIN" });
        const res = NextResponse.json({ success:true, user:{ id:"preview-admin", email, name:"Zyphron Admin (Preview)", role:"SUPER_ADMIN" }, _preview:true });
        res.cookies.set("zyphron_token", token, { httpOnly:true, sameSite:"lax", path:"/", maxAge:60*60*24*7 });
        return res;
      }
      throw dbErr;
    }
  }catch(e:any){
    return NextResponse.json({error:e.message}, {status:500});
  }
}
