"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Award, Building2, Briefcase, Code, Users, ArrowRight, Shield, Clock } from "lucide-react";

type Staff = { id:string; name:string; email:string; username:string; employeeId:string; status:string; role?:{name:string}; department?:{name:string}; lastActive?:string };

export default function LeadershipPage(){
  const [staff,setStaff]=useState<Staff[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ fetch("/api/staff?limit=100").then(r=>r.json()).then(d=> setStaff(d.data||[])).finally(()=> setLoading(false)); },[]);

  const founder = staff.filter(s=> ["SUPER_ADMIN","FOUNDER"].includes((s.role?.name||"").toUpperCase()));
  const coFounder = staff.filter(s=> ["CO_FOUNDER","CO-FOUNDER"].includes((s.role?.name||"").toUpperCase()));
  const ceo = staff.filter(s=> ["CEO","ADMIN"].includes((s.role?.name||"").toUpperCase()) && !founder.includes(s) && !coFounder.includes(s));
  const managers = staff.filter(s=> ["MANAGER","HR_MANAGER","TEAM_LEAD"].includes((s.role?.name||"").toUpperCase()));
  const technical = staff.filter(s=> ["Technical","Development","Infrastructure","Design"].includes(s.department?.name||""));

  function Section({ title, icon:Icon, color, bg, border, desc, data, empty, href }:{ title:string, icon:any, color:string, bg:string, border:string, desc:string, data:Staff[], empty:string, href:string }){
    return (
      <Card className={`${bg} ${border} border-2 overflow-hidden`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base">
            <span className={`h-9 w-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white`}><Icon className="h-5 w-5"/></span>
            <span>{title}</span>
            <Badge variant="secondary" className="ml-auto">{data.length}</Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? <div className="h-24 skeleton rounded-xl"/> : data.length===0 ? (
            <div className="text-xs text-muted-foreground py-8 text-center border-2 border-dashed rounded-xl bg-white/60 dark:bg-slate-900/60">
              {empty}<br/><Link href="/staff" className="text-primary underline text-xs mt-2 inline-block">Manage Staff →</Link>
            </div>
          ) : data.map((s:Staff)=>(
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border shadow-soft hover:shadow-medium transition-shadow">
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-sm`}>{s.name[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium flex items-center gap-2">{s.name} <Badge variant={s.status==="Active"?"success":"secondary"} className="text-[10px]">{s.status}</Badge></div>
                <div className="text-xs text-muted-foreground truncate">{s.role?.name||"—"} • {s.department?.name||"—"} • @{s.username}</div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3"/> {s.lastActive? new Date(s.lastActive).toLocaleDateString("en-IN"):"—"}</div>
              </div>
              <Link href={`/staff/${s.id}`}><Button size="sm" variant="outline" className="h-8">View</Button></Link>
            </div>
          ))}
          {data.length>4 && <Link href={href}><Button variant="ghost" size="sm" className="w-full gap-2">View all in {title} <ArrowRight className="h-4 w-4"/></Button></Link>}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><Crown className="h-6 w-6 text-amber-500"/> Leadership & Technical — Distinct Areas</h1>
        <p className="text-sm text-muted-foreground">5 separate work areas — Founder, Co-founder, CEO, Manager, Technical Department. Each is a distinct section with its own staff, live from PostgreSQL.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Section title="Founder" icon={Crown} color="from-amber-500 to-yellow-600" bg="bg-amber-50 dark:bg-amber-950/20" border="border-amber-200 dark:border-amber-900" desc="Vision & ownership — SUPER_ADMIN / FOUNDER role" data={founder} empty="No founder yet — assign a staff to SUPER_ADMIN / Founder" href="/staff" />
        <Section title="Co-founder" icon={Award} color="from-slate-600 to-slate-800" bg="bg-slate-50 dark:bg-slate-800/50" border="border-slate-200 dark:border-slate-700" desc="Co-leadership — CO_FOUNDER role" data={coFounder} empty="No co-founder yet" href="/staff" />
        <Section title="CEO" icon={Building2} color="from-blue-600 to-indigo-600" bg="bg-blue-50 dark:bg-blue-950/20" border="border-blue-200 dark:border-blue-900" desc="Executive leadership — CEO / ADMIN" data={ceo} empty="No CEO yet — create ADMIN/CEO role" href="/staff" />
        <Section title="Manager" icon={Briefcase} color="from-emerald-500 to-teal-600" bg="bg-emerald-50 dark:bg-emerald-950/20" border="border-emerald-200 dark:border-emerald-900" desc="Team management — MANAGER / HR_MANAGER / TEAM_LEAD" data={managers} empty="No managers yet" href="/staff" />
        <Section title="Technical Department" icon={Code} color="from-violet-600 to-indigo-600" bg="bg-violet-50 dark:bg-violet-950/20" border="border-violet-200 dark:border-violet-900" desc="Engineering & infra — Development / Infrastructure / Design / Technical" data={technical} empty="No technical staff — add to Development/Infrastructure" href="/departments" />
      </div>

      <Card className="border-dashed">
        <CardContent className="p-4 flex flex-wrap gap-2 items-center justify-between">
          <div className="text-sm"><span className="font-medium">Whole Team</span> <span className="text-muted-foreground">— {staff.length} total • Switch to</span></div>
          <div className="flex gap-2">
            <Link href="/staff"><Button size="sm" variant="outline" className="gap-2"><Users className="h-4 w-4"/> Staff</Button></Link>
            <Link href="/"><Button size="sm" variant="outline" className="gap-2"><Users className="h-4 w-4"/> Homepage Team</Button></Link>
            <Link href="/applications"><Button size="sm" className="gap-2">Applications <ArrowRight className="h-4 w-4"/></Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
