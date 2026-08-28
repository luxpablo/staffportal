"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PerformancePage(){
  const [data,setData]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  useEffect(()=>{
    fetch("/api/performance").then(r=> r.json()).then(d=>{
      if(d.error) setError(d.error);
      else setData(d.data||[]);
    }).catch(e=> setError(e.message)).finally(()=> setLoading(false));
  },[]);
  if(loading) return <div className="h-64 skeleton"/>;
  if(error) return <Card><CardContent className="p-8 text-center text-sm text-red-600">Failed to load performance: {error}</CardContent></Card>;
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Performance</h1><p className="text-sm text-muted-foreground">Calculated from real tasks and reviews in the database</p></div>
      {data.length===0 ? (
        <Card><CardContent className="py-12 text-center"><div className="text-sm font-medium">No performance data yet</div><div className="text-xs text-muted-foreground mt-1">Create staff and assign tasks — performance scores are calculated from completed tasks and manager reviews.</div></CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {data.map((s:any)=>(
            <Card key={s.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">{s.name?.[0]}</div>
                <div className="flex-1">
                  <div className="font-medium">{s.name} <Badge className="ml-2" variant={s.score>=90?"success": s.score>=80?"warning":"secondary"}>{s.score}/100</Badge></div>
                  <div className="text-xs text-muted-foreground mt-1">{s.tasks} tasks • {s.completed} completed • Quality {s.quality||0}/5 • {s.department||"—"}</div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden"><div className="h-full bg-primary" style={{width:`${s.score}%`}}/></div>
                </div>
                <Button size="sm" variant="outline">Review</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card>
        <CardHeader><CardTitle className="text-base">Add Performance Review</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Managers can submit reviews via API: POST /api/performance with userId, reviewerId, score, quality and comments. Reviews are audited and affect the score.</CardContent>
      </Card>
    </div>
  );
}
