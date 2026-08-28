// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

export async function GET(req:NextRequest){
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page=parseInt(searchParams.get("page")||"1");
  const limit=20; const skip=(page-1)*limit;
  try{
    const where:any={}; if(status) where.status=status;
    const [data,total]=await Promise.all([
      prisma.payout.findMany({ where, include:{ user:{select:{name:true,email:true}}}, orderBy:{createdAt:"desc"}, skip, take:limit }),
      prisma.payout.count({where}),
    ]);
    return NextResponse.json({ data, total });
  }catch(e:any){ if(/Authentication failed|Can.t reach|P1001/i.test(e.message)){ return NextResponse.json({ data:[], total:0, _warning:"Database unreachable" }); } return NextResponse.json({error:e.message},{status:500});}
}

export async function POST(req:NextRequest){
  try{
    const body=await req.json();
    const { userId, amount, type, description, paymentMethod } = body;
    if(!userId||!amount) return NextResponse.json({error:"Missing fields"},{status:400});
    const payoutId=`PAY-${Math.floor(100+Math.random()*900)}`;
    const payout=await prisma.payout.create({ data:{ payoutId, userId, amount: parseFloat(amount), type: type||"Manual", status:"Pending", description, paymentMethod }});
    await prisma.earningsTransaction.create({ data:{ userId, amount: parseFloat(amount), type:"CREDIT", category: (type||"MANUAL").toUpperCase().replace(" ","_"), description: description||`Payout ${payoutId} pending`, payoutId: payout.id, balanceAfter: null }});
    await auditLog({ action:"Payout created", entity:"Payout", entityId:payout.id, newValue: { userId, amount, type } });
    try{
      const user = await prisma.user.findUnique({ where:{ id: userId }});
      if(user?.email){
        const { enqueueEmail } = await import("@/lib/email");
        await enqueueEmail({
          recipient: user.email,
          subject:`Payout created: ₹${amount} — ${type}`,
          templateKey:"payout_paid",
          relatedEntity:"Payout", relatedId: payout.id,
          vars:{ staff_name: user.name, payout_amount:`₹${amount}`, payout_status:"Created", company_name:"Zyphron Cloud", login_url: process.env.APP_URL||"http://localhost:3000/login" }
        });
      }
    }catch{}
    return NextResponse.json({ success:true, data:payout }, {status:201});
  }catch(e:any){ return NextResponse.json({error:e.message},{status:500});}
}

