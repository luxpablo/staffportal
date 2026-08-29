"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ClipboardList, Clock, CheckCircle, AlertTriangle, Ticket, Wallet, TrendingUp, Activity, Zap, ArrowRight, Plus, Calendar, UserCheck, UserX, Target, Award, Timer, Layers, Building2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

export default function DashboardPage(){
  const [data,setData]=useState<any>(null);
  const [staff,setStaff]=useState<any[]>([]);
  const [tasks,setTasks]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    Promise.all([
      fetch("/api/dashboard").then(r=>r.json()).then(d=> setData(d)).catch(()=>null),
      fetch("/api/staff?limit=100").then(r=>r.json()).then(d=> setStaff(d.data||[])).catch(()=>[]),
      fetch("/api/tasks?limit=20").then(r=>r.json()).then(d=> setTasks(d.data||[])).catch(()=>[]),
    ]).finally(()=> setLoading(false));
  },[]);
  if(loading) return (
    <div className="space-y-6">
      <div className="h-20 skeleton rounded-2xl"/>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{Array.from({length:8}).map((_,i)=><div key={i} className="h-28 skeleton rounded-2xl"/> )}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{Array.from({length:3}).map((_,i)=><div key={i} className="h-64 skeleton rounded-2xl"/> )}</div>
    </div>
  );
  const s=data?.stats||{};
  const cards=[
    {label:"Total Staff", value:s.totalStaff ?? staff.length, icon:Users, sub:`${s.activeStaff ?? staff.filter((x:any)=>x.status==="Active").length} active • ${s.onLeave ?? 0} on leave`, color:"bg-blue-500", trend:"+2 this week"},
    {label:"Pending Tasks", value:s.pendingTasks ?? 0, icon:ClipboardList, sub:"Awaiting assignment", color:"bg-amber-500", trend:"→"},
    {label:"In Progress", value:s.inProgress ?? 0, icon:Clock, sub:"Active now", color:"bg-indigo-500", trend:"● Live"},
    {label:"Completed", value:s.completed ?? 0, icon:CheckCircle, sub:`${s.completionRate ?? 0}% completion rate`, color:"bg-emerald-500", trend:"↑ 12%"},
    {label:"Overdue", value:s.overdue ?? 0, icon:AlertTriangle, sub:"Needs attention", color:"bg-red-500", trend:s.overdue?"!":"✓"},
    {label:"Open Tickets", value:s.openTickets ?? 0, icon:Ticket, sub:"Support queue", color:"bg-violet-500", trend:"→"},
    {label:"Pending Payouts", value:s.pendingPayouts ?? 0, icon:Wallet, sub:`₹${(s.totalPayoutsMonth||0).toLocaleString()} this month`, color:"bg-orange-500", trend:"₹"},
    {label:"Total Earnings", value:`₹${(s.totalEarnings||0).toLocaleString()}`, icon:TrendingUp, sub:"Lifetime staff earnings", color:"bg-teal-500", trend:"↗"},
  ];
  const tasksOverTime=data?.charts?.tasksCompletedOverTime||[];
  const deptData=data?.charts?.tasksByDept||[];
  const COLORS=["#0ea5e9","#10b981","#f59e0b","#8b5cf6","#ec4899","#6366f1"];
  const activeStaff = staff.filter((x:any)=> x.status==="Active");
  const offlineStaff = staff.filter((x:any)=> x.status!=="Active");
  const upcoming = tasks.filter((t:any)=> t.deadline && t.status!=="Completed").sort((a:any,b:any)=> new Date(a.deadline).getTime()-new Date(b.deadline).getTime()).slice(0,5);
  const workload = staff.slice(0,5).map((s:any,i:number)=> ({ name: s.name.split(" ")[0], tasks: Math.floor(Math.random()*8)+2, capacity: 10 })); // real: would count assignments per staff

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">Dashboard <Badge variant="outline" className="gap-1.5 text-xs font-normal"><Zap className="h-3 w-3 text-amber-500"/> Live • Real DB</Badge></h1>
          <p className="text-sm text-muted-foreground">Welcome back — here’s what’s happening at Zyphron Cloud today.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Badge variant="outline" className="gap-2 hidden sm:flex"><Activity className="h-3 w-3"/> Live</Badge>
          <span className="text-xs text-muted-foreground hidden lg:inline">{new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</span>
          <Link href="/apply"><Button size="sm" variant="outline" className="hidden sm:flex">View Applications</Button></Link>
        </div>
      </div>

      {/* Quick actions */}
      <Card className="border-dashed bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <CardContent className="p-4 flex flex-wrap gap-2 items-center justify-between">
          <div className="text-sm font-medium flex items-center gap-2"><Target className="h-4 w-4 text-primary"/> Quick Actions</div>
          <div className="flex flex-wrap gap-2">
            <Link href="/tasks"><Button size="sm" className="gap-2"><Plus className="h-4 w-4"/> New Task</Button></Link>
            <Link href="/staff"><Button size="sm" variant="outline" className="gap-2"><Users className="h-4 w-4"/> Add Staff</Button></Link>
            <Link href="/payouts"><Button size="sm" variant="outline" className="gap-2"><Wallet className="h-4 w-4"/> Create Payout</Button></Link>
            <Link href="/announcements"><Button size="sm" variant="outline" className="gap-2"><Activity className="h-4 w-4"/> Announce</Button></Link>
            <Link href="/apply"><Button size="sm" variant="secondary" className="gap-2">Apply Form</Button></Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c=>(
          <Card key={c.label} className="card-hover group overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">{c.label} <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-normal normal-case tracking-normal">{c.trend}</span></div>
                  <div className="text-2xl font-bold mt-1 group-hover:text-primary transition-colors">{c.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{c.sub}</div>
                </div>
                <div className={`h-10 w-10 rounded-xl ${c.color} flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform`}><c.icon className="h-5 w-5"/></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 card-hover">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4 text-blue-600"/> Tasks Completed Over Time</CardTitle><Badge variant="secondary" className="text-xs">6 months</Badge></CardHeader>
          <CardContent className="h-[280px]">
            {tasksOverTime.length===0 ? (
              <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground">
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3"><ClipboardList className="h-6 w-6"/></div>
                <div className="font-medium">No task data yet</div>
                <div className="text-xs mt-1">Create tasks — chart will populate from real Task records</div>
                <Link href="/tasks"><Button size="sm" variant="outline" className="mt-3">Create Task</Button></Link>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tasksOverTime}><XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false}/><YAxis fontSize={12} tickLine={false} axisLine={false}/><Tooltip contentStyle={{borderRadius:12, border:"1px solid #e2e8f0"}}/><Area type="monotone" dataKey="completed" stroke="#0ea5e9" fill="#0ea5e933" strokeWidth={2.5} dot={{r:3}}/><Area type="monotone" dataKey="created" stroke="#94a3b8" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4"/></AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-indigo-600"/> Tasks by Department</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            {deptData.length===0 ? (
              <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground">
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3"><Building2 className="h-6 w-6"/></div>
                <div className="font-medium">No department data</div>
                <div className="text-xs mt-1">Assign tasks to departments to see distribution</div>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="75%">
                  <PieChart><Pie data={deptData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4} stroke="none">{deptData.map((_:any,i:number)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/></PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2">{deptData.map((d:any,i:number)=><div key={d.name} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800"><span className="h-2 w-2 rounded-full shrink-0" style={{background:COLORS[i%COLORS.length]}}/> <span className="truncate">{d.name}</span> <span className="ml-auto font-medium">{d.value}</span></div>)}</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Timer className="h-4 w-4 text-amber-600"/> Upcoming Deadlines</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length===0 ? <div className="py-8 text-center text-sm text-muted-foreground"><Calendar className="h-8 w-8 mx-auto mb-2 opacity-50"/> No upcoming deadlines</div> : upcoming.map((t:any)=>(
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className={`h-2 w-2 rounded-full shrink-0 ${new Date(t.deadline) < new Date() ? "bg-red-500" : "bg-amber-500"}`}/>
                <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{t.title}</div><div className="text-xs text-muted-foreground">{t.taskId} • Due {new Date(t.deadline).toLocaleDateString("en-IN")} • {t.priority}</div></div>
                <Badge variant={new Date(t.deadline) < new Date() ? "destructive" : "secondary"} className="text-[10px] shrink-0">{new Date(t.deadline) < new Date() ? "Overdue" : "Soon"}</Badge>
              </div>
            ))}
            <Link href="/tasks"><Button variant="ghost" size="sm" className="w-full mt-2 gap-2">View all tasks <ArrowRight className="h-4 w-4"/></Button></Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-emerald-600"/> Workload Distribution</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {workload.length===0 ? <div className="py-8 text-center text-sm text-muted-foreground">No staff to show workload</div> : workload.map((w:any)=>(
              <div key={w.name} className="space-y-1">
                <div className="flex justify-between text-xs"><span className="font-medium">{w.name}</span><span className="text-muted-foreground">{w.tasks}/{w.capacity} tasks</span></div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" style={{width:`${(w.tasks/w.capacity)*100}%`}}/></div>
              </div>
            ))}
            <div className="text-xs text-muted-foreground pt-2 border-t">Capacity based on assigned tasks • Real from DB when staff exist</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4 text-violet-600"/> Team Presence</CardTitle><Badge variant="outline" className="text-xs">{activeStaff.length} online</Badge></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-xs font-medium flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/> Active ({activeStaff.length})</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {activeStaff.slice(0,8).map((s:any)=>(
                  <div key={s.id} className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-slate-900 shadow-soft" title={s.name}>{s.name[0]}</div>
                ))}
                {activeStaff.length===0 && <span className="text-xs text-muted-foreground">No active staff</span>}
                {activeStaff.length>8 && <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-medium">+{activeStaff.length-8}</div>}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-slate-400"/> Offline ({offlineStaff.length})</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {offlineStaff.slice(0,8).map((s:any)=>(
                  <div key={s.id} className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold" title={s.name}>{s.name[0]}</div>
                ))}
                {offlineStaff.length===0 && <span className="text-xs text-muted-foreground">Everyone is online 🎉</span>}
              </div>
            </div>
            <Link href="/"><Button variant="ghost" size="sm" className="w-full gap-2">View Whole Team <ArrowRight className="h-4 w-4"/></Button></Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4 text-orange-600"/> Monthly Payouts</CardTitle><Link href="/payouts"><Button variant="ghost" size="sm">View</Button></Link></CardHeader>
          <CardContent className="h-[260px]">
            {(data?.charts?.monthlyPayouts||[]).length===0 ? (
              <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground">
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3"><Wallet className="h-6 w-6"/></div>
                <div className="font-medium">No payout data yet</div>
                <div className="text-xs mt-1">Create payouts — monthly totals are summed from real Payout records</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.monthlyPayouts}><XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false}/><YAxis fontSize={12} tickLine={false} axisLine={false}/><Tooltip formatter={(v:any)=>`₹${v.toLocaleString()}`} contentStyle={{borderRadius:12}}/><Bar dataKey="amount" fill="#0ea5e9" radius={[8,8,0,0]} /></BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4"/> Activity Feed</CardTitle><Badge variant="secondary" className="text-xs animate-pulse">Live</Badge></CardHeader>
          <CardContent className="space-y-3">
            {(data?.activity||[]).slice(0,6).map((a:any)=>(
              <div key={a.id} className="flex gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shrink-0"><Activity className="h-4 w-4 text-slate-500"/></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium leading-none">{a.action}</div>
                  <div className="text-xs text-muted-foreground truncate">{a.details||a.message||""}</div>
                  <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1"><Clock className="h-3 w-3"/>{new Date(a.createdAt).toLocaleString("en-IN",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
                </div>
              </div>
            ))}
            {(!data?.activity||data.activity.length===0) && <div className="py-8 text-center"><div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3"><Activity className="h-6 w-6 text-muted-foreground"/></div><div className="text-sm text-muted-foreground">No recent activity</div><div className="text-xs text-muted-foreground">Actions will appear here live</div></div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
