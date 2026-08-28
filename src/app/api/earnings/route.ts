// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(req:NextRequest){
  const userId = new URL(req.url).searchParams.get("userId");
  try{
    const where:any={}; if(userId) where.userId=userId;
    const [transactions, totals] = await Promise.all([
      prisma.earningsTransaction.findMany({ where, orderBy:{createdAt:"desc"}, take:50, include:{ user:{select:{name:true}} } }),
      prisma.earningsTransaction.groupBy({ by:["type"], where, _sum:{ amount:true } }),
    ]);
    const totalCredit = totals.find(t=> t.type==="CREDIT")?._sum.amount||0;
    const totalDebit = totals.find(t=> t.type==="DEBIT")?._sum.amount||0;
    const pending = await prisma.payout.aggregate({ where:{ status:"Pending", ...(userId?{userId}:{}) }, _sum:{ amount:true }});
    const paid = await prisma.payout.aggregate({ where:{ status:"Paid", ...(userId?{userId}:{}) }, _sum:{ amount:true }});
    const thisMonth = await prisma.earningsTransaction.aggregate({ where:{ ...where, createdAt:{ gte: new Date(new Date().getFullYear(), new Date().getMonth(),1)}}, _sum:{ amount:true }});
    return NextResponse.json({
      transactions,
      summary:{
        total: totalCredit - Math.abs(totalDebit),
        pending: pending._sum.amount||0,
        paid: paid._sum.amount||0,
        thisMonth: thisMonth._sum.amount||0,
      }
    });
  }catch(e:any){
    if(/Authentication failed|Can't reach|P1001/i.test(e.message)){
      return NextResponse.json({ transactions:[], summary:{ total:0, pending:0, paid:0, thisMonth:0 }, _warning:"Database unreachable" });
    }
    return NextResponse.json({error:e.message},{status:500});
  }
}

