"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, Clock, Plus, Users, Lock, Crown } from "lucide-react";

export default function MeetingsPage(){
  const [meetings,setMeetings]=useState<any[]>([]);
  const [showCreate,setShowCreate]=useState(false);
  const [form,setForm]=useState({ title:"", description:"", type:"SCHEDULED", scheduledStart:"", scheduledEnd:"", workspaceId:"", departmentId:"", waitingRoomEnabled:false, password:"" });
  const [departments,setDepartments]=useState<any[]>([]);

  const load=()=> fetch("/api/meetings").then(r=>r.json()).then(d=> setMeetings(d.data||[]));
  useEffect(()=>{ load(); fetch("/api/departments").then(r=>r.json()).then(d=> setDepartments(d.data||[])); },[]);

  const create=async(e:React.FormEvent)=>{
    e.preventDefault();
    const res=await fetch("/api/meetings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    const j=await res.json();
    if(!res.ok) return alert(j.error);
    setShowCreate(false);
    load();
  };

  const quickMeeting=async()=>{
    const now=new Date();
    const end=new Date(now.getTime()+3600000);
    const res=await fetch("/api/meetings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ title:`Instant Meeting — ${now.toLocaleTimeString()}`, type:"INSTANT", scheduledStart: now.toISOString(), scheduledEnd: end.toISOString() })});
    const j=await res.json();
    if(!res.ok) return alert(j.error);
    window.location.href=`/meet/${j.data.meetingCode}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Video className="h-6 w-6 text-blue-600"/> Meetings</h1>
          <p className="text-sm text-muted-foreground">Voice, video, screen share — WebRTC via Socket.IO signaling, SFU-ready</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={quickMeeting} className="gap-2 bg-emerald-600 hover:bg-emerald-700"><Video className="h-4 w-4"/> Start Instant Meeting</Button>
          <Button onClick={()=> setShowCreate(true)} className="gap-2"><Plus className="h-4 w-4"/> Schedule</Button>
        </div>
      </div>

      <div className="grid gap-3">
        {meetings.length===0 ? <Card><CardContent className="py-12 text-center"><div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto"><Video className="h-6 w-6 text-muted-foreground"/></div><div className="mt-3 font-medium">No meetings yet</div><div className="text-sm text-muted-foreground">Schedule or start an instant meeting — all with real WebRTC, not fake video.</div></CardContent></Card> : meetings.map((m:any)=>(
          <Card key={m.id} className="card-hover">
            <CardContent className="p-4 flex gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white shrink-0 ${m.status==="LIVE"?"bg-red-500 animate-pulse": m.status==="SCHEDULED"?"bg-blue-500":"bg-slate-500"}`}><Video className="h-6 w-6"/></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{m.title}</span>
                  <Badge variant={m.status==="LIVE"?"destructive": m.status==="SCHEDULED"?"secondary":"outline"}>{m.status}</Badge>
                  <Badge variant="outline" className="text-[10px]">{m.type}</Badge>
                  {m.isLocked && <Badge variant="destructive" className="gap-1 text-[10px]"><Lock className="h-3 w-3"/> Locked</Badge>}
                  {m.waitingRoomEnabled && <Badge variant="warning" className="text-[10px]">Waiting Room</Badge>}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{m.description||""} • Host: {m.host?.name} • {new Date(m.scheduledStart).toLocaleString("en-IN")} → {new Date(m.scheduledEnd).toLocaleTimeString("en-IN")} • {m._count?.participants||1} participants</div>
                <div className="text-xs font-mono text-muted-foreground">Code: {m.meetingCode} {m.workspaceId?`• ${m.workspaceId}`:""} {m.department?.name?`• ${m.department.name}`:""}</div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Link href={`/meet/${m.meetingCode}`}><Button size="sm" className="w-full gap-2"><Video className="h-4 w-4"/> Join</Button></Link>
                <Link href={`/meet/${m.meetingCode}`}><Button size="sm" variant="outline" className="w-full">Details</Button></Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={()=> setShowCreate(false)}>
          <form onSubmit={create} onClick={e=> e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl my-8">
            <h3 className="font-semibold">Schedule Meeting</h3>
            <div className="space-y-1"><Label>Title *</Label><Input value={form.title} onChange={e=> setForm({...form, title:e.target.value})} required placeholder="Weekly Staff Meeting"/></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={e=> setForm({...form, description:e.target.value})} placeholder="Agenda..." rows={2}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Type</Label><select value={form.type} onChange={e=> setForm({...form, type:e.target.value})} className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option>SCHEDULED</option><option>INSTANT</option><option>PRIVATE</option><option>DEPARTMENT</option><option>COMPANY</option><option>ONE_TO_ONE</option></select></div>
              <div className="space-y-1"><Label>Workspace</Label><select value={form.workspaceId} onChange={e=> setForm({...form, workspaceId:e.target.value})} className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option value="">None</option><option value="founder">Founder Office</option><option value="development">Development</option><option value="support">Support</option></select></div>
              <div className="space-y-1"><Label>Start *</Label><Input type="datetime-local" value={form.scheduledStart} onChange={e=> setForm({...form, scheduledStart:e.target.value})} required /></div>
              <div className="space-y-1"><Label>End *</Label><Input type="datetime-local" value={form.scheduledEnd} onChange={e=> setForm({...form, scheduledEnd:e.target.value})} required /></div>
              <div className="space-y-1"><Label>Password (optional)</Label><Input type="password" value={form.password} onChange={e=> setForm({...form, password:e.target.value})} placeholder="Meeting password"/></div>
              <div className="space-y-1"><Label>Department</Label><select value={form.departmentId} onChange={e=> setForm({...form, departmentId:e.target.value})} className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option value="">None</option>{departments.map((d:any)=> <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.waitingRoomEnabled} onChange={e=> setForm({...form, waitingRoomEnabled:e.target.checked})}/> Waiting room</label>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=> setShowCreate(false)}>Cancel</Button><Button type="submit">Create</Button></div>
          </form>
        </div>
      )}

      <Card className="border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground">
          Real WebRTC: mesh via Socket.IO signaling for 2-8 participants, SFU-ready (LiveKit/mediasoup) via <code className="bg-muted px-1 rounded">src/lib/meetingProvider.ts</code> abstraction. Join links are <code className="bg-muted px-1 rounded">/meet/ZYP-MEET-xxxx</code> (meetingCode, not sequential ID, revocable).
        </CardContent>
      </Card>
    </div>
  );
}
