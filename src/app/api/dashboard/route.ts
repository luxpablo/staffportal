// @ts-nocheck
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(){
  try{
    const [totalStaff, activeStaff, onLeave, totalTasks, pendingTasks, inProgress, completed, overdue, openTickets, pendingReviews, pendingPayouts] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where:{ status:"Active"}}),
      prisma.user.count({ where:{ status:"On Leave"}}),
      prisma.task.count(),
      prisma.task.count({ where:{ status:{ in:["Backlog","Assigned"]}}}),
      prisma.task.count({ where:{ status:"In Progress"}}),
      prisma.task.count({ where:{ status:"Completed"}}),
      prisma.task.count({ where:{ status:{ notIn:["Completed","Cancelled"]}, deadline:{ lt:new Date()}}}),
      prisma.ticket.count({ where:{ status:{ in:["Open","Assigned"]}}}),
      prisma.task.count({ where:{ status:"Under Review"}}),
      prisma.payout.count({ where:{ status:"Pending"}}),
    ]);
    const totalPayoutsMonth = await prisma.payout.aggregate({ where:{ createdAt:{ gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)}}, _sum:{ amount:true }});
    const totalEarnings = await prisma.earningsTransaction.aggregate({ where:{ type:"CREDIT"}, _sum:{ amount:true }});
    const tasksByDeptRaw = await prisma.task.groupBy({ by:["departmentId"], _count:true });
    const recentActivity = await prisma.auditLog.findMany({ orderBy:{createdAt:"desc"}, take:10 });
    // Build tasksByDept with department names
    const tasksByDept = [];
    for(const g of tasksByDeptRaw){
      if(g.departmentId){
        const dept = await prisma.department.findUnique({ where:{ id:g.departmentId }, select:{ name:true }});
        tasksByDept.push({ name: dept?.name||g.departmentId, value: g._count });
      } else {
        tasksByDept.push({ name:"Unassigned", value: g._count });
      }
    }
    // Monthly payouts aggregated by month (last 6 months)
    const payouts = await prisma.payout.findMany({ select:{ amount:true, createdAt:true }});
    const monthlyMap = new Map();
    for(const p of payouts){
      const key = p.createdAt.toLocaleString("en-IN",{month:"short"});
      monthlyMap.set(key, (monthlyMap.get(key)||0)+p.amount);
    }
    const monthlyPayouts = Array.from(monthlyMap.entries()).map(([month,amount])=>({month,amount}));
    // Tasks completed over time (last 6 months)
    const tasks = await prisma.task.findMany({ select:{ createdAt:true, updatedAt:true, status:true }});
    const monthMap = new Map();
    for(const t of tasks){
      const m = t.createdAt.toLocaleString("en-IN",{month:"short"});
      if(!monthMap.has(m)) monthMap.set(m,{name:m, completed:0, created:0});
      monthMap.get(m).created++;
      if(t.status==="Completed") monthMap.get(m).completed++;
    }
    const tasksCompletedOverTime = Array.from(monthMap.values()).slice(-6);
    return NextResponse.json({
      stats:{
        totalStaff, activeStaff, onLeave, pendingTasks, inProgress, completed, overdue, openTickets, pendingReviews, pendingPayouts,
        totalPayoutsMonth: totalPayoutsMonth._sum.amount||0,
        totalEarnings: totalEarnings._sum.amount||0,
        completionRate: totalTasks? Math.round(completed/totalTasks*100):0,
      },
      charts:{ tasksCompletedOverTime, tasksByDept, monthlyPayouts },
      activity: recentActivity,
    });
  }catch(e:any){
    if(/Authentication failed|Can't reach|P1001/i.test(e.message)){
      return NextResponse.json({
        stats:{ totalStaff:0, activeStaff:0, onLeave:0, pendingTasks:0, inProgress:0, completed:0, overdue:0, openTickets:0, pendingReviews:0, pendingPayouts:0, totalPayoutsMonth:0, totalEarnings:0, completionRate:0 },
        charts:{ tasksCompletedOverTime:[], tasksByDept:[], monthlyPayouts:[] },
        activity:[],
        _warning:"Database unreachable — configure DATABASE_URL and run prisma migrate"
      });
    }
    return NextResponse.json({ error:e.message }, {status:500});
  }
}
