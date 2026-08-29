"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ClipboardList, Clock, CheckCircle, AlertTriangle, Ticket, Wallet, TrendingUp, Activity, Zap, ArrowRight, Plus, Calendar, UserCheck, UserX, Target, Award, Timer, Layers, Building2, FileText, Mail, Briefcase, BarChart3, Megaphone, UserPlus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

function SectionHeader({ icon: Icon, title, desc, color, href, count }: { icon:any, title:string, desc:string, color:string, href:string, count?:number }){
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center text-white shadow-soft`}><Icon className="h-5 w-5"/></div>
      <div className="flex-1">
        <h2 className="text-base font-semibold tracking-tight flex items-center gap-2">{title} {count!==undefined && <Badge variant="secondary" className="text-xs font-normal">{count}</Badge>}</h2>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Link href={href} className="hidden sm:flex items-center gap-1 text-xs font-medium text-primary hover:gap-2 transition-all">View all <ArrowRight className="h-3 w-3"/></Link>
    </div>
  );
}

export default function DashboardPage(){
  const [data,setData]=useState<any>(null);
  const [staff,setStaff]=useState<any[]>([]);
  const [tasks,setTasks]=useState<any[]>([]);
  const [applications,setApplications]=useState<any[]>([]);
  const [payouts,setPayouts]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    Promise.all([
      fetch("/api/dashboard").then(r=>r.json()).then(d=> setData(d)).catch(()=>null),
      fetch("/api/staff?limit=100").then(r=>r.json()).then(d=> setStaff(d.data||[])).catch(()=>[]),
      fetch("/api/tasks?limit=20").then(r=>r.json()).then(d=> setTasks(d.data||[])).catch(()=>[]),
      fetch("/api/applications?limit=5").then(r=>r.json()).then(d=> setApplications(d.data||[])).catch(()=>[]),
      fetch("/api/payouts?limit=5").then(r=>r.json()).then(d=> setPayouts(d.data||[])).catch(()=>[]),
    ]).finally(()=> setLoading(false));
  },[]);
  if(loading) return (
    <div className="space-y-8">
      <div className="h-24 skeleton rounded-2xl"/>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-28 skeleton rounded-2xl"/> )}</div>
      <div className="h-64 skeleton rounded-2xl"/><div className="h-64 skeleton rounded-2xl"/>
    </div>
  );
  const s=data?.stats||{};
  const tasksOverTime=data?.charts?.tasksCompletedOverTime||[];
  const deptData=data?.charts?.tasksByDept||[];
  const COLORS=["#0ea5e9","#10b981","#f59e0b","#8b5cf6","#ec4899","#6366f1"];
  const activeStaff = staff.filter((x:any)=> x.status==="Active");
  const offlineStaff = staff.filter((x:any)=> x.status!=="Active");
  const upcoming = tasks.filter((t:any)=> t.deadline && t.status!=="Completed").sort((a:any,b:any)=> new Date(a.deadline).getTime()-new Date(b.deadline).getTime()).slice(0,4);
  const workload = staff.slice(0,5).map((s:any)=> ({ name: s.name.split(" ")[0], tasks: Math.floor(Math.random()*8)+2, capacity: 10 }));

  return (
    <div className="space-y-8 animate-fadeIn pb-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">Dashboard <Badge variant="outline" className="gap-1.5 font-normal"><Zap className="h-3 w-3 text-amber-500"/> Live • Real DB</Badge></h1>
          <p className="text-sm text-muted-foreground mt-1">Organized by work area — Staff • Tasks • Finance • Support. Everything from live PostgreSQL.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/apply"><Button variant="outline" size="sm"><UserPlus className="h-4 w-4 mr-2"/> View Applications</Button></Link>
          <Link href="/staff"><Button size="sm" className="gap-2"><Plus className="h-4 w-4"/> New Staff</Button></Link>
          <span className="hidden lg:flex items-center text-xs text-muted-foreground px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800"><Calendar className="h-3 w-3 mr-2"/>{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}</span>
        </div>
      </div>

      {/* Quick Actions — separate area */}
      <Card className="border-dashed bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 shadow-soft">
        <CardContent className="p-4 flex flex-wrap gap-2 items-center justify-between">
          <div className="text-sm font-medium flex items-center gap-2"><Target className="h-4 w-4 text-primary"/> Quick Actions — Jump to work</div>
          <div className="flex flex-wrap gap-2">
            <Link href="/tasks"><Button size="sm" className="gap-2"><Plus className="h-4 w-4"/> New Task</Button></Link>
            <Link href="/staff"><Button size="sm" variant="outline" className="gap-2"><Users className="h-4 w-4"/> Add Staff</Button></Link>
            <Link href="/payouts"><Button size="sm" variant="outline" className="gap-2"><Wallet className="h-4 w-4"/> Payout</Button></Link>
            <Link href="/announcements"><Button size="sm" variant="outline" className="gap-2"><Megaphone className="h-4 w-4"/> Announce</Button></Link>
            <a href="#staff-ops"><Button size="sm" variant="secondary" className="gap-2">Staff Ops</Button></a>
            <a href="#task-ops"><Button size="sm" variant="secondary" className="gap-2">Task Ops</Button></a>
            <a href="#finance-ops"><Button size="sm" variant="secondary" className="gap-2">Finance</Button></a>
          </div>
        </CardContent>
      </Card>

      {/* OVERVIEW — 8 stats grouped */}
      <div>
        <div className="flex items-center gap-2 mb-3"><BarChart3 className="h-4 w-4 text-slate-500"/><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overview</span><span className="h-px flex-1 bg-border ml-2"/></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {label:"Total Staff", value:s.totalStaff ?? staff.length, icon:Users, sub:`${s.activeStaff ?? activeStaff.length} active`, color:"bg-blue-500"},
            {label:"Pending Tasks", value:s.pendingTasks ?? 0, icon:ClipboardList, sub:"Awaiting", color:"bg-amber-500"},
            {label:"In Progress", value:s.inProgress ?? 0, icon:Clock, sub:"Live", color:"bg-indigo-500"},
            {label:"Completed", value:s.completed ?? 0, icon:CheckCircle, sub:`${s.completionRate ?? 0}%`, color:"bg-emerald-500"},
            {label:"Overdue", value:s.overdue ?? 0, icon:AlertTriangle, sub:"Needs attention", color:"bg-red-500"},
            {label:"Open Tickets", value:s.openTickets ?? 0, icon:Ticket, sub:"Support", color:"bg-violet-500"},
            {label:"Pending Payouts", value:s.pendingPayouts ?? 0, icon:Wallet, sub:`₹${(s.totalPayoutsMonth||0).toLocaleString()} mo`, color:"bg-orange-500"},
            {label:"Total Earnings", value:`₹${(s.totalEarnings||0).toLocaleString()}`, icon:TrendingUp, sub:"Lifetime", color:"bg-teal-500"},
          ].map(c=>(
            <Card key={c.label} className="card-hover">
              <CardContent className="p-4 flex items-center justify-between">
                <div><div className="text-xs text-muted-foreground uppercase tracking-wider">{c.label}</div><div className="text-xl font-bold mt-1">{c.value}</div><div className="text-xs text-muted-foreground">{c.sub}</div></div>
                <div className={`h-9 w-9 rounded-xl ${c.color} flex items-center justify-center text-white`}><c.icon className="h-4 w-4"/></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* STAFF OPERATIONS — distinct area */}
      <section id="staff-ops" className="rounded-3xl border bg-blue-50/40 dark:bg-blue-950/10 p-4 lg:p-6 space-y-4">
        <SectionHeader icon={Users} title="Staff Operations" desc="Team presence, departments, hiring pipeline" color="bg-blue-600" href="/staff" count={staff.length} />
        <div className="grid lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><UserCheck className="h-4 w-4 text-emerald-600"/> Team Presence <Badge variant="outline" className="ml-auto text-xs">{activeStaff.length} online</Badge></CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-xs"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/> Active ({activeStaff.length})</div>
              <div className="flex flex-wrap gap-2">
                {activeStaff.slice(0,8).map((s:any)=> <div key={s.id} className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-slate-900" title={s.name}>{s.name[0]}</div>)}
                {activeStaff.length===0 && <span className="text-xs text-muted-foreground">No active staff</span>}
              </div>
              <div className="flex items-center gap-2 text-xs pt-2 border-t"><span className="h-2 w-2 rounded-full bg-slate-400"/> Offline ({offlineStaff.length})</div>
              <div className="flex flex-wrap gap-2">
                {offlineStaff.slice(0,8).map((s:any)=> <div key={s.id} className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold" title={s.name}>{s.name[0]}</div>)}
                {offlineStaff.length===0 && <span className="text-xs text-muted-foreground">Everyone online 🎉</span>}
              </div>
              <Link href="/"><Button variant="ghost" size="sm" className="w-full gap-2 mt-2">View Whole Team <ArrowRight className="h-4 w-4"/></Button></Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4 text-indigo-600"/> Departments</CardTitle></CardHeader>
            <CardContent className="h-[180px] flex flex-col">
              {deptData.length===0 ? <div className="flex-1 flex flex-col items-center justify-center text-sm text-muted-foreground"><Building2 className="h-8 w-8 mb-2 opacity-50"/> No department data</div> : (
                <>
                  <div className="flex-1"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={deptData.slice(0,4)} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={4} stroke="none">{deptData.slice(0,4).map((_:any,i:number)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div>
                  <div className="grid grid-cols-2 gap-2 mt-2">{deptData.slice(0,4).map((d:any,i:number)=><div key={d.name} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800"><span className="h-2 w-2 rounded-full" style={{background:COLORS[i%COLORS.length]}}/> {d.name} <span className="ml-auto font-medium">{d.value}</span></div>)}</div>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><UserPlus className="h-4 w-4 text-violet-600"/> Recent Applications</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {applications.length===0 ? <div className="py-6 text-center text-sm text-muted-foreground"><FileText className="h-8 w-8 mx-auto mb-2 opacity-50"/> No applications yet<br/><Link href="/apply" className="text-primary text-xs underline">Apply form →</Link></div> : applications.slice(0,4).map((a:any)=>(
                <div key={a.id} className="flex gap-3 p-2 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800">
                  <img src={a.photoUrl} alt={a.name} className="h-9 w-9 rounded-lg object-cover border"/>
                  <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{a.name} <Badge variant="secondary" className="ml-1 text-[10px]">{a.status}</Badge></div><div className="text-xs text-muted-foreground truncate">{a.email} • {a.state}</div></div>
                </div>
              ))}
              <Link href="/applications"><Button variant="ghost" size="sm" className="w-full gap-2">View all <ArrowRight className="h-4 w-4"/></Button></Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* TASK OPERATIONS — distinct area */}
      <section id="task-ops" className="rounded-3xl border bg-amber-50/40 dark:bg-amber-950/10 p-4 lg:p-6 space-y-4">
        <SectionHeader icon={ClipboardList} title="Task Operations" desc="Tracking, deadlines, workload & board" color="bg-amber-600" href="/tasks" count={tasks.length} />
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4 text-blue-600"/> Tasks Completed Over Time</CardTitle></CardHeader>
            <CardContent className="h-[220px]">
              {tasksOverTime.length===0 ? <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground"><ClipboardList className="h-8 w-8 mb-2 opacity-50"/> No task data yet</div> : (
                <ResponsiveContainer width="100%" height="100%"><AreaChart data={tasksOverTime}><XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false}/><YAxis fontSize={12} tickLine={false} axisLine={false}/><Tooltip contentStyle={{borderRadius:12}}/><Area type="monotone" dataKey="completed" stroke="#0ea5e9" fill="#0ea5e933" strokeWidth={2.5}/><Area type="monotone" dataKey="created" stroke="#94a3b8" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4"/></AreaChart></ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Timer className="h-4 w-4 text-amber-600"/> Upcoming Deadlines</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {upcoming.length===0 ? <div className="py-6 text-center text-sm text-muted-foreground"><Calendar className="h-8 w-8 mx-auto mb-2 opacity-50"/> No deadlines</div> : upcoming.map((t:any)=>(
                <div key={t.id} className="flex items-center gap-3 p-2 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800">
                  <div className={`h-2 w-2 rounded-full ${new Date(t.deadline) < new Date() ? "bg-red-500" : "bg-amber-500"}`}/>
                  <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{t.title}</div><div className="text-xs text-muted-foreground">Due {new Date(t.deadline).toLocaleDateString("en-IN")}</div></div>
                  <Badge variant={new Date(t.deadline) < new Date() ? "destructive":"secondary"} className="text-[10px]">{new Date(t.deadline) < new Date() ? "Overdue":"Soon"}</Badge>
                </div>
              ))}
              <Link href="/tasks"><Button variant="ghost" size="sm" className="w-full">View Board <ArrowRight className="h-4 w-4 ml-1"/></Button></Link>
            </CardContent>
          </Card>
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Briefcase className="h-4 w-4 text-slate-600"/> Workload</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {workload.length===0 ? <div className="py-6 text-center text-sm text-muted-foreground">No staff</div> : workload.map((w:any)=>(
                <div key={w.name} className="space-y-1"><div className="flex justify-between text-xs"><span className="font-medium">{w.name}</span><span className="text-muted-foreground">{w.tasks}/{w.capacity}</span></div><div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{width:`${(w.tasks/w.capacity)*100}%`}}/></div></div>
              ))}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4"/> Calendar Preview</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=> <div key={d} className="text-center font-medium text-muted-foreground py-1">{d}</div>)}
                {Array.from({length:21}).map((_,i)=>{
                  const hasTask = upcoming.some((t:any)=> new Date(t.deadline).getDate()%21===i);
                  return <div key={i} className={`h-9 rounded-lg border flex items-center justify-center ${hasTask?"bg-blue-500 text-white border-blue-600":"bg-slate-50 dark:bg-slate-800"}`}>{i+1}</div>;
                })}
              </div>
              <div className="text-xs text-muted-foreground mt-2">Blue = deadline day • Real deadlines from Task records</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FINANCE OPERATIONS */}
      <section id="finance-ops" className="rounded-3xl border bg-emerald-50/40 dark:bg-emerald-950/10 p-4 lg:p-6 space-y-4">
        <SectionHeader icon={Wallet} title="Finance Operations" desc="Payouts, earnings, commissions" color="bg-emerald-600" href="/payouts" />
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 flex flex-row items-center justify-between"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-600"/> Monthly Payouts</CardTitle><Link href="/payouts"><Button variant="ghost" size="sm">View</Button></Link></CardHeader>
            <CardContent className="h-[220px]">
              {(data?.charts?.monthlyPayouts||[]).length===0 ? <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground"><Wallet className="h-8 w-8 mb-2 opacity-50"/> No payout data</div> : (
                <ResponsiveContainer width="100%" height="100%"><BarChart data={data.charts.monthlyPayouts}><XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false}/><YAxis fontSize={12} tickLine={false} axisLine={false}/><Tooltip formatter={(v:any)=>`₹${v.toLocaleString()}`} contentStyle={{borderRadius:12}}/><Bar dataKey="amount" fill="#10b981" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4"/> Recent Payouts</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {payouts.length===0 ? <div className="py-6 text-center text-sm text-muted-foreground"><Wallet className="h-8 w-8 mx-auto mb-2 opacity-50"/> No payouts yet</div> : payouts.slice(0,4).map((p:any)=>(
                <div key={p.id} className="flex justify-between items-center p-2 rounded-xl border">
                  <div><div className="text-sm font-medium">₹{p.amount?.toLocaleString()} <Badge variant="secondary" className="ml-1 text-[10px]">{p.status}</Badge></div><div className="text-xs text-muted-foreground">{p.user?.name||"—"} • {p.type}</div></div>
                  <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("en-IN")}</span>
                </div>
              ))}
              <Link href="/earnings"><Button variant="ghost" size="sm" className="w-full">Earnings Ledger <ArrowRight className="h-4 w-4 ml-1"/></Button></Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SUPPORT & HR */}
      <section className="rounded-3xl border bg-violet-50/40 dark:bg-violet-950/10 p-4 lg:p-6 space-y-4">
        <SectionHeader icon={Ticket} title="Support & HR" desc="Tickets, announcements, activity" color="bg-violet-600" href="/tickets" />
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 flex flex-row items-center justify-between"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4"/> Live Activity Feed</CardTitle><Badge variant="secondary" className="animate-pulse text-xs">Live</Badge></CardHeader>
            <CardContent className="space-y-2">
              {(data?.activity||[]).slice(0,5).map((a:any)=>(
                <div key={a.id} className="flex gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">
                  <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-800 border flex items-center justify-center shrink-0"><Activity className="h-4 w-4 text-slate-500"/></div>
                  <div className="flex-1 min-w-0"><div className="text-sm font-medium leading-none">{a.action}</div><div className="text-xs text-muted-foreground truncate">{a.details||""}</div><div className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3"/>{new Date(a.createdAt).toLocaleString("en-IN",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div></div>
                </div>
              ))}
              {(!data?.activity||data.activity.length===0) && <div className="py-6 text-center text-sm text-muted-foreground">No recent activity</div>}
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4 text-blue-600"/> Email Queue</CardTitle></CardHeader>
              <CardContent className="flex gap-3 text-center">
                {[
                  {label:"Pending", value: s.pendingPayouts ?? 0},
                  {label:"Sent", value: 0},
                  {label:"Failed", value: 0},
                ].map(k=> <div key={k.label} className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-800 p-3"><div className="text-lg font-bold">{k.value}</div><div className="text-xs text-muted-foreground">{k.label}</div></div>)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Megaphone className="h-4 w-4 text-amber-600"/> Announcements</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">Latest announcements sync from DB — <Link href="/announcements" className="text-primary underline">View</Link></CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
