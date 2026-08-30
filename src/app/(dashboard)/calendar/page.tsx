"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus, Video } from "lucide-react";
import Link from "next/link";

export default function CalendarPage(){
  const [view,setView]=useState<"month"|"week"|"day"|"agenda">("month");
  const [date,setDate]=useState(new Date());
  const [events,setEvents]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);

  const load=()=>{
    setLoading(true);
    const params=new URLSearchParams({ view, date: date.toISOString() });
    fetch(`/api/calendar?${params}`).then(r=>r.json()).then(d=> setEvents(d.data||[])).finally(()=> setLoading(false));
  };
  useEffect(()=>{ load(); },[view, date]);

  const monthDays=()=>{
    const y=date.getFullYear(), m=date.getMonth();
    const first=new Date(y,m,1).getDay();
    const days=new Date(y,m+1,0).getDate();
    const arr=[];
    for(let i=0;i<first;i++) arr.push(null);
    for(let i=1;i<=days;i++) arr.push(new Date(y,m,i));
    return arr;
  };

  const isToday=(d:Date)=> d && new Date().toDateString()===d.toDateString();
  const hasEvent=(d:Date)=> events.some(e=> new Date(e.startsAt).toDateString()===d.toDateString());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Calendar className="h-6 w-6 text-blue-600"/> Calendar</h1>
          <p className="text-sm text-muted-foreground">Meetings, deadlines, interviews, maintenance — timezone {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/meetings"><Button size="sm" className="gap-2"><Video className="h-4 w-4"/> New Meeting</Button></Link>
          <Button size="sm" variant="outline" onClick={()=> setDate(new Date())}>Today</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-3 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={()=> {
              const d=new Date(date);
              if(view==="month") d.setMonth(d.getMonth()-1);
              else if(view==="week") d.setDate(d.getDate()-7);
              else d.setDate(d.getDate()-1);
              setDate(d);
            }}><ChevronLeft className="h-4 w-4"/></Button>
            <span className="font-medium min-w-[160px] text-center">{date.toLocaleDateString("en-IN",{month:"long",year:"numeric",day: view!=="month"? "numeric":undefined, weekday: view!=="month"? "long":undefined})}</span>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={()=> {
              const d=new Date(date);
              if(view==="month") d.setMonth(d.getMonth()+1);
              else if(view==="week") d.setDate(d.getDate()+7);
              else d.setDate(d.getDate()+1);
              setDate(d);
            }}><ChevronRight className="h-4 w-4"/></Button>
          </div>
          <div className="flex rounded-xl border p-1 gap-1">
            {(["month","week","day","agenda"] as const).map(v=>(
              <Button key={v} size="sm" variant={view===v?"secondary":"ghost"} className="h-7 px-3 capitalize" onClick={()=> setView(v)}>{v}</Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {view==="month" && (
        <Card>
          <CardContent className="p-0 overflow-hidden">
            <div className="grid grid-cols-7 text-xs font-medium text-muted-foreground border-b">
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=> <div key={d} className="py-2 text-center">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {monthDays().map((d,i)=>(
                <div key={i} className={`min-h-[90px] border-r border-b p-2 ${!d?"bg-slate-50 dark:bg-slate-900/50":""} ${d && isToday(d)?"bg-blue-50 dark:bg-blue-950/20":""} `}>
                  {d && <>
                    <div className={`text-xs font-medium h-6 w-6 rounded-full flex items-center justify-center ${isToday(d)?"bg-blue-600 text-white":""}`}>{d.getDate()}</div>
                    <div className="mt-1 space-y-1">
                      {events.filter(e=> new Date(e.startsAt).toDateString()===d.toDateString()).slice(0,3).map((e:any)=>(
                        <div key={e.id} className={`text-[11px] px-1.5 py-0.5 rounded truncate ${e.type==="MEETING"?"bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200": e.visibility==="COMPANY"?"bg-emerald-100 text-emerald-700":"bg-slate-100 dark:bg-slate-800"}`}>
                          {new Date(e.startsAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})} {e.title}
                        </div>
                      ))}
                      {events.filter(e=> new Date(e.startsAt).toDateString()===d.toDateString()).length>3 && <div className="text-[10px] text-muted-foreground">+{events.filter(e=> new Date(e.startsAt).toDateString()===d.toDateString()).length-3} more</div>}
                    </div>
                  </>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(view==="week" || view==="day" || view==="agenda") && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4"/> {view==="agenda"?"Agenda (next 14 days)": view==="week"?"Week": "Day"}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {loading ? <div className="h-32 skeleton rounded-xl"/> : events.length===0 ? <div className="py-12 text-center text-sm text-muted-foreground">No events — meetings, tasks and deadlines will appear here</div> : events.slice(0,20).map((e:any)=>(
              <div key={e.id} className="flex gap-3 p-3 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800">
                <div className="text-xs font-medium min-w-[80px]">{new Date(e.startsAt).toLocaleString("en-IN",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium flex items-center gap-2">{e.title} <Badge variant="outline" className="text-[10px]">{e.type}</Badge> <Badge variant={e.visibility==="PRIVATE"?"destructive": e.visibility==="COMPANY"?"success":"secondary"} className="text-[10px]">{e.visibility}</Badge></div>
                  <div className="text-xs text-muted-foreground truncate">{e.description||""} • {e.creator?.name}</div>
                  {e.meeting?.meetingCode && <Link href={`/meet/${e.meeting.meetingCode}`} className="text-xs text-blue-600 underline">Join → /meet/{e.meeting.meetingCode}</Link>}
                </div>
                <div className="text-xs text-muted-foreground">{e.timezone}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground">
          <div>Visibility: <Badge variant="outline" className="text-[10px]">PRIVATE</Badge> only you, <Badge variant="secondary" className="text-[10px]">PARTICIPANTS</Badge> invited, <Badge className="text-[10px]">DEPARTMENT/WORKSPACE</Badge> dept, <Badge variant="success" className="text-[10px]">COMPANY</Badge> all. Founder private events use <code className="bg-muted px-1 rounded">PRIVATE</code>.</div>
        </CardContent>
      </Card>
    </div>
  );
}
