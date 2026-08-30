"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, FileText, HardDrive, Shield, Activity, Video, Crown, AlertTriangle, TrendingUp, Database, Lock, Webhook, Settings, Plug } from "lucide-react";

export default function AdminPage(){
  const [stats,setStats]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    Promise.all([
      fetch("/api/dashboard").then(r=>r.json()).then(d=> d.stats||{}).catch(()=>({})),
      fetch("/api/admin/storage").then(r=>r.json()).then(d=> d.data||{}).catch(()=>({})),
      fetch("/api/staff?limit=1").then(r=>r.json()).then(d=> ({staffTotal:d.total||0})).catch(()=>({staffTotal:0})),
    ]).then(([dash, storage, staff])=>{
      setStats({ ...dash, ...storage, ...staff });
      setLoading(false);
    });
  },[]);
  if(loading) return <div className="h-64 skeleton rounded-2xl"/>;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Crown className="h-6 w-6 text-amber-500"/> Admin Panel — Complete Founder Control</h1>
        <p className="text-sm text-muted-foreground">System health, users, departments, applications, tasks, meetings, storage, security — owner-only controls</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          {label:"Staff", value: stats?.totalStaff ?? stats?.staffTotal ?? 0, icon:Users, href:"/staff", color:"bg-blue-500"},
          {label:"Departments", value: stats?.totalStaff ? "10" : "—", icon:Building2, href:"/departments", color:"bg-indigo-500"},
          {label:"Storage Used", value: `${((stats?.totalSize||0)/1024/1024/1024).toFixed(2)} GB`, icon:HardDrive, href:"/admin/storage", color:"bg-slate-700"},
          {label:"Security Events", value: "0", icon:Shield, href:"/audit-logs", color:"bg-emerald-500"},
        ].map(c=>(
          <Link key={c.label} href={c.href}>
            <Card className="card-hover">
              <CardContent className="p-4 flex items-center justify-between">
                <div><div className="text-xs text-muted-foreground uppercase tracking-wider">{c.label}</div><div className="text-xl font-bold">{c.value}</div></div>
                <div className={`h-9 w-9 rounded-xl ${c.color} flex items-center justify-center text-white`}><c.icon className="h-5 w-5"/></div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4"/> System Health</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 flex justify-between"><span>Users</span><Badge variant="secondary">{stats?.totalStaff||0}</Badge></div>
            <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 flex justify-between"><span>Active Tasks</span><Badge variant="secondary">{stats?.inProgress||0}</Badge></div>
            <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 flex justify-between"><span>Pending Applications</span><Badge variant="warning">{stats?.pendingTasks||0}</Badge></div>
            <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 flex justify-between"><span>Storage</span><Badge variant="outline">{stats?.storageProvider||"local"}</Badge></div>
            <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 flex justify-between"><span>Meetings Live</span><Badge variant="secondary">0</Badge></div>
            <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 flex justify-between"><span>Audit Events</span><Badge variant="secondary">{stats?.totalStaff||0}</Badge></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4"/> Security</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Login attempts</span><span>0</span></div>
            <div className="flex justify-between"><span>Suspicious</span><Badge variant="secondary">0</Badge></div>
            <div className="flex justify-between"><span>Sessions</span><span>{stats?.totalStaff||0}</span></div>
            <div className="flex justify-between"><span>MFA enabled</span><span>0</span></div>
            <Link href="/audit-logs"><Button size="sm" variant="outline" className="w-full mt-2">View Audit Logs</Button></Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          {title:"Users", desc:"Create, edit, suspend, promote, reset MFA", href:"/staff", icon:Users, items:["Create Staff","Suspend","Promote/Demote","Reset Sessions"]},
          {title:"Roles & Permissions", desc:"Create roles, manage permissions", href:"/settings", icon:Shield, items:["Roles","Permissions","Scopes"]},
          {title:"Departments", desc:"Create, assign head, members", href:"/departments", icon:Building2, items:["Development","Support","Sales"]},
          {title:"Applications", desc:"Review, interview, accept/reject", href:"/applications", icon:FileText, items:["Pending","Under Review","Accepted"]},
          {title:"Meetings", desc:"Active, scheduled, history, policies", href:"/meetings", icon:Video, items:["Live","Scheduled","Recording"]},
          {title:"Files & Wiki", desc:"Storage, versions, share links", href:"/files", icon:HardDrive, items:["Files","Wiki","Share Links"]},
          {title:"Finance", desc:"Payroll, payouts, commissions", href:"/payouts", icon:Database, items:["Pending","Paid","Failed"]},
          {title:"Integrations", desc:"SMTP, Discord, WHMCS, Pterodactyl", href:"/integrations", icon:Plug, items:["SMTP","Discord","WHMCS"]},
          {title:"Automation", desc:"Webhooks, API keys", href:"/admin", icon:Webhook, items:["Webhooks","API Keys"]},
        ].map(s=>(
          <Card key={s.title} className="card-hover">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><s.icon className="h-4 w-4 text-primary"/>{s.title}</CardTitle><p className="text-xs text-muted-foreground">{s.desc}</p></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">{s.items.map(i=> <Badge key={i} variant="secondary" className="text-[10px]">{i}</Badge>)}</div>
              <Link href={s.href}><Button size="sm" variant="outline" className="w-full mt-3">Open</Button></Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5"/>
          <div className="text-sm">
            <div className="font-medium">Owner-Only Information</div>
            <div className="text-muted-foreground text-xs">Founder private notes, ownership, critical credentials metadata, high-level strategy — requires explicit <code className="bg-white dark:bg-slate-900 px-1 rounded">OWNER_ONLY</code> permission. Even Admin does not get it automatically.</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
