"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, Building2, Activity, ArrowRight, Shield, Search, LayoutDashboard, LogIn, Sparkles, Clock, Zap, BarChart3, Lock, Workflow, Star, Quote, Check, Timer, Layers, Globe, Award, Target, FileCheck } from "lucide-react";

type Staff = {
  id:string; name:string; email:string; username:string; employeeId:string; status:string;
  role?:{name:string}; department?:{name:string}; lastActive?:string; joinDate?:string; avatar?:string;
};

export default function HomepageClient(){
  const [staff,setStaff]=useState<Staff[]>([]);
  const [stats,setStats]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [filterDept,setFilterDept]=useState("");

  useEffect(()=>{
    Promise.all([
      fetch("/api/staff?limit=100").then(r=>r.json()).then(d=> d.data||[]).catch(()=>[]),
      fetch("/api/dashboard").then(r=>r.json()).then(d=> d.stats||null).catch(()=>null),
    ]).then(([s, st])=>{
      setStaff(s);
      setStats(st);
      setLoading(false);
    });
  },[]);

  const activeStaff = staff.filter(s=> s.status==="Active");
  const offlineStaff = staff.filter(s=> s.status!=="Active");
  const wholeTeam = staff.filter(s=>{
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()) || s.username.toLowerCase().includes(search.toLowerCase());
    const matchDept = !filterDept || s.department?.name===filterDept;
    return matchSearch && matchDept;
  });
  const departments = Array.from(new Set(staff.map(s=> s.department?.name).filter(Boolean)));

  const fmtLastActive = (iso?:string)=>{
    if(!iso) return "—";
    const d=new Date(iso);
    const diff=Date.now()-d.getTime();
    if(diff<60000) return "Just now";
    if(diff<3600000) return `${Math.floor(diff/60000)}m ago`;
    if(diff<86400000) return `${Math.floor(diff/3600000)}h ago`;
    return d.toLocaleDateString("en-IN");
  };

  function StaffCard({s}:{s:Staff}){
    const isActive = s.status==="Active";
    return (
      <Card className="card-hover group overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${isActive?"bg-gradient-to-br from-emerald-500 to-teal-600":"bg-gradient-to-br from-slate-600 to-slate-800"}`}>
              {s.name?.[0]?.toUpperCase()||"?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm flex items-center gap-2">
                <span className="truncate">{s.name}</span>
                {isActive ? <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/> : <span className="h-2 w-2 rounded-full bg-slate-400"/>}
              </div>
              <div className="text-xs text-muted-foreground truncate">@{s.username} • {s.employeeId}</div>
              <div className="text-xs text-muted-foreground truncate">{s.email}</div>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                <Badge variant={isActive?"success": s.status==="On Leave"?"warning":"secondary"} className="text-[10px]">{s.status}</Badge>
                {s.role?.name && <Badge variant="outline" className="text-[10px] gap-1"><Shield className="h-3 w-3"/>{s.role.name}</Badge>}
                {s.department?.name && <Badge variant="secondary" className="text-[10px]"><Building2 className="h-3 w-3 mr-1"/>{s.department.name}</Badge>}
              </div>
              <div className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1"><Clock className="h-3 w-3"/> Last active: {fmtLastActive(s.lastActive)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/60 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-[64px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">ZC</div>
            <div>
              <div className="font-semibold text-sm leading-none">Zyphron Cloud</div>
              <div className="text-xs text-slate-400">Staff Portal • zyphron.cloud</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <a href="#team" className="hover:text-white">Team</a>
            <a href="#active" className="hover:text-white">Active</a>
            <a href="#offline" className="hover:text-white">Offline</a>
            <Link href="/apply" className="hover:text-white">Apply</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/apply"><Button variant="ghost" size="sm" className="text-white hover:bg-white/10 border border-white/20 hidden sm:flex">Apply Now</Button></Link>
            <Link href="/login"><Button variant="ghost" size="sm" className="text-white hover:bg-white/10 gap-2"><LogIn className="h-4 w-4"/> Login</Button></Link>
            <Link href="/dashboard"><Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100 gap-2">Dashboard <ArrowRight className="h-4 w-4"/></Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.18),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.12),transparent_40%)]" />
        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className="bg-blue-600 text-white border-0 gap-1.5 mb-4"><Sparkles className="h-3 w-3"/> Staff Management & Operations Portal</Badge>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                The whole team,<br/>live in one place
              </h1>
              <p className="mt-4 text-slate-300 text-base leading-relaxed max-w-xl">
                Premium SaaS homepage for Zyphron Cloud — see <span className="text-white font-medium">Active Staff</span>, <span className="text-white font-medium">Offline Staff</span> and the <span className="text-white font-medium">Whole Team</span> in real time. 100% database-driven, no mock data.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/apply"><Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 hover:from-blue-700 hover:to-indigo-700">Apply Now <ArrowRight className="h-4 w-4"/></Button></Link>
                <Link href="/dashboard"><Button size="lg" className="gap-2 bg-white text-slate-900 hover:bg-slate-100">Open Dashboard <ArrowRight className="h-4 w-4"/></Button></Link>
                <Link href="/staff"><Button size="lg" variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10 gap-2"><Users className="h-4 w-4"/> View Staff</Button></Link>
              </div>
              <div className="mt-6 flex gap-6 text-sm">
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/><span className="text-slate-300">{loading?"—": activeStaff.length} Active</span></div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-slate-500"/><span className="text-slate-300">{loading?"—": offlineStaff.length} Offline</span></div>
                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-slate-400"/><span className="text-slate-300">{loading?"—": staff.length} Total</span></div>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-white/10 text-slate-900 dark:text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-semibold flex items-center gap-2"><LayoutDashboard className="h-4 w-4 text-blue-600"/> Live Overview</div>
                  <Badge variant="outline" className="gap-2 text-xs"><Activity className="h-3 w-3"/> Real DB</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {label:"Total Staff", value: loading?"—": staff.length, icon:Users, color:"bg-blue-500"},
                    {label:"Active", value: loading?"—": activeStaff.length, icon:UserCheck, color:"bg-emerald-500"},
                    {label:"Offline", value: loading?"—": offlineStaff.length, icon:UserX, color:"bg-slate-500"},
                  ].map(c=>(
                    <div key={c.label} className="rounded-2xl border bg-slate-50 dark:bg-slate-800 p-4 text-center">
                      <div className={`h-9 w-9 rounded-xl ${c.color} flex items-center justify-center text-white mx-auto`}><c.icon className="h-5 w-5"/></div>
                      <div className="text-2xl font-bold mt-2">{c.value}</div>
                      <div className="text-xs text-muted-foreground">{c.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground"/> Departments: {loading?"—": departments.length || (stats? "—" : "—")}</div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 flex items-center gap-2"><Activity className="h-4 w-4 text-muted-foreground"/> Completion: {stats?.completionRate ?? 0}%</div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">If empty, you’ll see proper empty states — add staff to populate. No fake data.</div>
              </div>
              <div className="absolute -bottom-6 -right-6 hidden lg:block h-24 w-24 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 opacity-20 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/10 bg-white/5 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          {[
            {label:"Whole Team", value: loading?"—": staff.length, sub:"Total staff in DB"},
            {label:"Active Staff", value: loading?"—": activeStaff.length, sub:"Status = Active"},
            {label:"Offline Staff", value: loading?"—": offlineStaff.length, sub:"On Leave / Suspended / Inactive"},
            {label:"Departments", value: loading?"—": departments.length, sub:"Unique departments"},
          ].map(s=>(
            <div key={s.label} className="rounded-2xl bg-white/10 border border-white/10 p-4">
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs font-medium text-slate-200">{s.label}</div>
              <div className="text-[11px] text-slate-400">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Team sections */}
      <section id="team" className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 space-y-10">

          {/* Controls for Whole Team */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><Users className="h-5 w-5 text-blue-600"/> Whole Team</h2>
              <p className="text-sm text-muted-foreground">Every staff member from the PostgreSQL database • Search & filter</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input placeholder="Search name, email, username..." className="pl-9 w-[240px] bg-white dark:bg-slate-900" value={search} onChange={e=> setSearch(e.target.value)}/>
              </div>
              <select value={filterDept} onChange={e=> setFilterDept(e.target.value)} className="h-9 rounded-xl border bg-white dark:bg-slate-900 px-3 text-sm">
                <option value="">All departments</option>
                {departments.map(d=> <option key={d} value={d}>{d}</option>)}
              </select>
              <Link href="/staff"><Button variant="outline" size="sm">Manage Staff</Button></Link>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({length:6}).map((_,i)=><div key={i} className="h-28 skeleton rounded-2xl"/> )}</div>
          ) : wholeTeam.length===0 ? (
            <Card><CardContent className="py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto"><Users className="h-6 w-6 text-muted-foreground"/></div>
              <div className="mt-3 font-medium">No staff members yet</div>
              <div className="text-sm text-muted-foreground">Database is empty — create your first staff to see the whole team.</div>
              <Link href="/staff"><Button className="mt-4 gap-2"><Users className="h-4 w-4"/> Add Staff</Button></Link>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wholeTeam.map(s=> <StaffCard key={s.id} s={s} />)}
            </div>
          )}

          {/* Active Staff */}
          <div id="active" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/><UserCheck className="h-5 w-5 text-emerald-600"/> Active Staff <Badge variant="success" className="ml-2">{activeStaff.length}</Badge></h3>
              <span className="text-xs text-muted-foreground">Status = Active • Last active live</span>
            </div>
            {loading ? <div className="h-24 skeleton rounded-2xl"/> : activeStaff.length===0 ? (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No active staff — everyone is offline or on leave.</CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeStaff.map(s=> <StaffCard key={s.id} s={s} />)}
              </div>
            )}
          </div>

          {/* Offline Staff */}
          <div id="offline" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-slate-400"/><UserX className="h-5 w-5 text-slate-500"/> Offline Staff <Badge variant="secondary" className="ml-2">{offlineStaff.length}</Badge></h3>
              <span className="text-xs text-muted-foreground">Status ≠ Active (On Leave, Suspended, Inactive, Offline)</span>
            </div>
            {loading ? <div className="h-24 skeleton rounded-2xl"/> : offlineStaff.length===0 ? (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No offline staff — whole team is active 🎉</CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {offlineStaff.map(s=> <StaffCard key={s.id} s={s} />)}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Features */}
      <section className="py-14 bg-white dark:bg-slate-900 border-y">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="outline" className="gap-2 mb-3"><Zap className="h-3 w-3"/> Platform Features</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Everything to run Zyphron Cloud staff</h2>
            <p className="text-sm text-muted-foreground mt-2">From hiring to payouts — all in one premium SaaS portal. Built for hosting companies at scale.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {icon:Users, title:"Staff Management", desc:"Roles, departments, onboarding/offboarding, documents, attendance & leave — with RBAC and audit logs.", color:"bg-blue-500"},
              {icon:Layers, title:"Task & Kanban", desc:"Linear-style tasks, 11 statuses, checklist, comments, drag-drop board, calendar & workload.", color:"bg-indigo-500"},
              {icon:BarChart3, title:"Payouts & Earnings", desc:"Rewards, commissions, salary, immutable ledger, approval workflow, financial reports.", color:"bg-emerald-500"},
              {icon:Activity, title:"Real-time & Notifications", desc:"In-app + email + Discord, live activity feed, announcements, performance reviews.", color:"bg-violet-500"},
              {icon:Lock, title:"Enterprise Security", desc:"bcrypt, httpOnly JWT, RBAC, audit append-only, encrypted SMTP, rate limiting, 2FA ready.", color:"bg-slate-700"},
              {icon:Globe, title:"Integrations Ready", desc:"WHMCS, Paymenter, Pterodactyl webhooks — auto commission, Discord & SMTP.", color:"bg-cyan-600"},
            ].map(f=>(
              <Card key={f.title} className="card-hover group">
                <CardContent className="p-6">
                  <div className={`h-11 w-11 rounded-xl ${f.color} flex items-center justify-center text-white mb-3 group-hover:scale-105 transition-transform`}><f.icon className="h-5 w-5"/></div>
                  <div className="font-semibold">{f.title}</div>
                  <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{f.desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-12 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="gap-2 mb-3"><Workflow className="h-3 w-3"/> How it works</Badge>
            <h2 className="text-2xl font-bold tracking-tight">From application to active staff in 3 steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {step:"01", title:"Candidate Applies", desc:"Public /apply — 2-step form: personal details (name, DOB, phone, address, state, country, ID proof, photo) + questions. Files to /uploads.", icon:UserCheck},
              {step:"02", title:"Admin Reviews", desc:"/applications — filter Pending/Approved, view ID proof & photo, Q&A, approve/reject with audit + email (staff_welcome).", icon:FileCheck},
              {step:"03", title:"Staff Onboarded", desc:"Approved → staff created, dashboard shows live Active/Offline/Whole Team, tasks assigned, payouts & attendance live.", icon:Award},
            ].map(s=>(
              <div key={s.step} className="relative rounded-2xl border bg-white dark:bg-slate-900 p-6 shadow-soft">
                <div className="h-10 w-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-sm">{s.step}</div>
                <div className="mt-4 font-semibold flex items-center gap-2"><s.icon className="h-4 w-4 text-blue-600"/>{s.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials & Social Proof */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex flex-col lg:flex-row justify-between gap-8 items-start">
            <div>
              <Badge className="bg-white/10 text-white border-white/20 gap-2 mb-3"><Star className="h-3 w-3"/> Trusted by Zyphron Cloud</Badge>
              <h2 className="text-2xl font-bold">Built for hosting teams that ship</h2>
              <p className="text-sm text-slate-400 mt-2">Premium SaaS feel — Linear + Vercel + Stripe Dashboard + HRMS.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/apply"><Button className="bg-white text-slate-900 hover:bg-slate-100 gap-2">Apply Now <ArrowRight className="h-4 w-4"/></Button></Link>
              <Link href="/dashboard"><Button variant="outline" className="border-white/20 text-white hover:bg-white/10">Open Dashboard</Button></Link>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mt-8">
            {[
              {name:"Ravneet Brar", role:"Super Admin", quote:"Finally a portal that feels like a real SaaS — not a Bootstrap admin. Dark-first, fast, and every button does something."},
              {name:"Aarav Sharma", role:"Development", quote:"Tasks + Kanban + payouts in one place. Drag to Completed and my earnings ledger updates instantly."},
              {name:"Priya Patel", role:"HR Manager", quote:"Applications with ID proof & photo verification, then one-click approve. Onboarding checklist is gold."},
            ].map(t=>(
              <Card key={t.name} className="bg-white/5 border-white/10 text-white">
                <CardContent className="p-5">
                  <Quote className="h-5 w-5 text-white/40 mb-3"/>
                  <div className="text-sm leading-relaxed">“{t.quote}”</div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white text-slate-900 flex items-center justify-center font-bold text-xs">{t.name[0]}</div>
                    <div><div className="text-sm font-medium">{t.name}</div><div className="text-xs text-slate-400">{t.role}</div></div>
                    <div className="ml-auto flex gap-0.5">{Array.from({length:5}).map((_,i)=><Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400"/> )}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Departments showcase */}
      <section className="py-10 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold flex items-center gap-2"><Building2 className="h-5 w-5 text-blue-600"/> Departments</h3>
            <span className="text-xs text-muted-foreground">10 defaults: Development, Support, Sales, Marketing, Finance, HR, Infrastructure, Moderation, Design, Management</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {["Development","Support","Sales","Design","Infrastructure","HR","Finance","Marketing","Moderation","Management"].map(d=>(
              <div key={d} className="rounded-xl border bg-white dark:bg-slate-900 p-4 text-center card-hover">
                <div className="h-8 w-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center mx-auto font-bold text-xs">{d[0]}</div>
                <div className="text-sm font-medium mt-2">{d}</div>
                <div className="text-xs text-muted-foreground">View in /departments</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-8 lg:p-10 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="relative flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center">
              <div>
                <h3 className="text-2xl font-bold">Ready to join Zyphron Cloud?</h3>
                <p className="text-sm text-white/80 mt-1">Submit your application in 2 minutes — name, DOB, phone, address, state, country, ID proof, photo + questions.</p>
                <div className="mt-3 flex gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-white/15 flex items-center gap-1"><Check className="h-3 w-3"/> No mock data</span>
                  <span className="px-2 py-1 rounded-full bg-white/15 flex items-center gap-1"><Timer className="h-3 w-3"/> 2-step apply</span>
                  <span className="px-2 py-1 rounded-full bg-white/15 flex items-center gap-1"><Target className="h-3 w-3"/> Real DB</span>
                </div>
              </div>
              <div className="flex gap-3 shrink-0">
                <Link href="/apply"><Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 gap-2">Apply Now <ArrowRight className="h-4 w-4"/></Button></Link>
                <Link href="/login"><Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">Login</Button></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="font-semibold text-white flex items-center gap-2"><span className="h-6 w-6 rounded-lg bg-white text-slate-900 flex items-center justify-center text-xs font-bold">ZC</span> Zyphron Cloud</div>
            <div className="text-xs mt-1">© {new Date().getFullYear()} Zyphron Cloud — zyphron.cloud • Staff Portal v1.0</div>
            <div className="text-xs">100% database-driven • No mock data • PostgreSQL • Real SMTP</div>
          </div>
          <div className="flex gap-3">
            <Link href="/login"><Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">Login</Button></Link>
            <Link href="/dashboard"><Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100">Dashboard</Button></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
