"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ClipboardList, Clock, CheckCircle, AlertTriangle, Ticket, Wallet, TrendingUp, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

export default function DashboardPage(){
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ fetch("/api/dashboard").then(r=>r.json()).then(setData).finally(()=>setLoading(false)); },[]);
  if(loading) return <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{Array.from({length:8}).map((_,i)=><div key={i} className="h-28 skeleton"/> )}</div>;
  const s=data?.stats||{};
  const cards=[
    {label:"Total Staff", value:s.totalStaff, icon:Users, sub:`${s.activeStaff} active • ${s.onLeave} on leave`, color:"bg-blue-500"},
    {label:"Pending Tasks", value:s.pendingTasks, icon:ClipboardList, sub:"Awaiting assignment", color:"bg-amber-500"},
    {label:"In Progress", value:s.inProgress, icon:Clock, sub:"Active now", color:"bg-indigo-500"},
    {label:"Completed", value:s.completed, icon:CheckCircle, sub:`${s.completionRate}% completion rate`, color:"bg-emerald-500"},
    {label:"Overdue", value:s.overdue, icon:AlertTriangle, sub:"Needs attention", color:"bg-red-500"},
    {label:"Open Tickets", value:s.openTickets, icon:Ticket, sub:"Support queue", color:"bg-violet-500"},
    {label:"Pending Payouts", value:s.pendingPayouts, icon:Wallet, sub:`₹${(s.totalPayoutsMonth||0).toLocaleString()} this month`, color:"bg-orange-500"},
    {label:"Total Earnings", value:`₹${(s.totalEarnings||0).toLocaleString()}`, icon:TrendingUp, sub:"Lifetime staff earnings", color:"bg-teal-500"},
  ];
  const tasksOverTime=data?.charts?.tasksCompletedOverTime||[];
  const deptData=data?.charts?.tasksByDept||[];
  const COLORS=["#0ea5e9","#10b981","#f59e0b","#8b5cf6"];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back — here’s what’s happening at Zyphron Cloud today.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-2"><Activity className="h-3 w-3"/> Live</Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline">{new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c=>(
          <Card key={c.label} className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{c.label}</div>
                  <div className="text-2xl font-bold mt-1">{c.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{c.sub}</div>
                </div>
                <div className={`h-10 w-10 rounded-xl ${c.color} flex items-center justify-center text-white`}><c.icon className="h-5 w-5"/></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Tasks Completed Over Time</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            {tasksOverTime.length===0 ? (
              <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground">
                <div className="font-medium">No task data yet</div>
                <div className="text-xs mt-1">Create tasks — chart will populate from real Task records</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tasksOverTime}><XAxis dataKey="name" fontSize={12}/><YAxis fontSize={12}/><Tooltip/><Area type="monotone" dataKey="completed" stroke="#0ea5e9" fill="#0ea5e933" strokeWidth={2}/><Area type="monotone" dataKey="created" stroke="#94a3b8" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4"/></AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Tasks by Department</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            {deptData.length===0 ? (
              <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground">
                <div className="font-medium">No department data</div>
                <div className="text-xs mt-1">Assign tasks to departments to see distribution</div>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={deptData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4}>{deptData.map((_:any,i:number)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/></PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2">{deptData.map((d:any,i:number)=><div key={d.name} className="flex items-center gap-2 text-xs"><span className="h-2 w-2 rounded-full" style={{background:COLORS[i%COLORS.length]}}/> {d.name} <span className="ml-auto font-medium">{d.value}</span></div>)}</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Monthly Payouts</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            {(data?.charts?.monthlyPayouts||[]).length===0 ? (
              <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground">
                <div className="font-medium">No payout data yet</div>
                <div className="text-xs mt-1">Create payouts — monthly totals are summed from real Payout records</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.monthlyPayouts}><XAxis dataKey="month" fontSize={12}/><YAxis fontSize={12}/><Tooltip formatter={(v:any)=>`₹${v.toLocaleString()}`}/><Bar dataKey="amount" fill="#0ea5e9" radius={[8,8,0,0]}/></BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Activity Feed</CardTitle><Badge variant="secondary" className="text-xs">Live</Badge></CardHeader>
          <CardContent className="space-y-3">
            {(data?.activity||[]).slice(0,6).map((a:any)=>(
              <div key={a.id} className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"><Activity className="h-4 w-4 text-slate-500"/></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium leading-none">{a.action}</div>
                  <div className="text-xs text-muted-foreground truncate">{a.details||a.message||""}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{new Date(a.createdAt).toLocaleString("en-IN",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
                </div>
              </div>
            ))}
            {(!data?.activity||data.activity.length===0) && <div className="text-sm text-muted-foreground py-8 text-center">No recent activity</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
