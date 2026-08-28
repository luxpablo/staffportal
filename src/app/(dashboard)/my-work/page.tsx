"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function MyWorkPage(){
  const [tasks,setTasks]=useState<any[]>([]);
  const [notifications,setNotifications]=useState<any[]>([]);
  const [earnings,setEarnings]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    Promise.all([
      fetch("/api/tasks?limit=20").then(r=>r.json()).then(d=> d.data||[]),
      fetch("/api/notifications?limit=5").then(r=>r.json()).then(d=> d.data||[]),
      fetch("/api/earnings").then(r=>r.json()).then(d=> d.summary||null),
    ]).then(([t,n,e])=>{
      setTasks(t); setNotifications(n); setEarnings(e);
    }).finally(()=> setLoading(false));
  },[]);
  if(loading) return <div className="h-64 skeleton"/>;
  const myTasks=tasks.slice(0,4);
  const overdue=tasks.filter((t:any)=> t.deadline && new Date(t.deadline) < new Date() && t.status!=="Completed");
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">My Work</h1><p className="text-sm text-muted-foreground">Your personal productivity workspace — live from the database</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-5 text-center"><div className="text-3xl font-bold">{tasks.length}</div><div className="text-xs text-muted-foreground">My Tasks</div></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><div className="text-3xl font-bold text-amber-600">{overdue.length}</div><div className="text-xs text-muted-foreground">Overdue</div></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><div className="text-3xl font-bold text-emerald-600">₹{Number(earnings?.thisMonth||0).toLocaleString("en-IN")}</div><div className="text-xs text-muted-foreground">Earnings (month)</div></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Today’s Tasks</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {myTasks.length===0 ? <div className="py-8 text-center text-sm text-muted-foreground">No tasks assigned. Tasks assigned to you will appear here.</div> : myTasks.map((t:any)=> <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border"><div><div className="text-sm font-medium">{t.title}</div><div className="text-xs text-muted-foreground">{t.taskId} • {t.status}</div></div><Button size="sm" variant="outline">Start</Button></div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Upcoming Deadlines</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {myTasks.length===0 ? <div className="py-8 text-center text-sm text-muted-foreground">No deadlines</div> : myTasks.slice(0,3).map((t:any)=> <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"><div className="h-2 w-2 rounded-full bg-amber-500"/><div className="flex-1"><div className="text-sm font-medium">{t.title}</div><div className="text-xs text-muted-foreground">Due {t.deadline? new Date(t.deadline).toLocaleDateString("en-IN"): "—"}</div></div><Badge variant="warning" className="text-[10px]">{t.priority}</Badge></div>)}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {notifications.length===0 ? <div className="py-6 text-center text-sm text-muted-foreground">No notifications yet</div> : notifications.slice(0,5).map((n:any)=> <div key={n.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm">{n.title} — {n.message}</div>)}
        </CardContent>
      </Card>
    </div>
  );
}
