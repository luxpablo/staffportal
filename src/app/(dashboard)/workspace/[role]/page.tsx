"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Crown, Award, Building2, Briefcase, Code, Users, MessageCircle, ClipboardList, Activity, Phone, FilePlus, Clock, CheckCircle, XCircle, Send, UserPlus, ArrowRight } from "lucide-react";

const roleConfig: Record<string, { title:string, desc:string, icon:any, color:string, bg:string, border:string, roleNames:string[], deptNames:string[] }> = {
  founder: { title:"Founder", desc:"Full authority — give work to anyone, chat with anyone, receive all updates & requests", icon:Crown, color:"from-amber-500 to-yellow-600", bg:"bg-amber-50 dark:bg-amber-950/20", border:"border-amber-200 dark:border-amber-900", roleNames:["SUPER_ADMIN","FOUNDER"], deptNames:[] },
  "co-founder": { title:"Co-founder", icon:Award, color:"from-slate-600 to-slate-800", bg:"bg-slate-50 dark:bg-slate-800/50", border:"border-slate-200 dark:border-slate-700", desc:"Co-leadership — same scope as Founder", roleNames:["CO_FOUNDER","CO-FOUNDER"], deptNames:[] },
  ceo: { title:"CEO", icon:Building2, color:"from-blue-600 to-indigo-600", bg:"bg-blue-50 dark:bg-blue-950/20", border:"border-blue-200 dark:border-blue-900", desc:"Executive — assign across all departments", roleNames:["CEO","ADMIN"], deptNames:[] },
  manager: { title:"Manager", icon:Briefcase, color:"from-emerald-500 to-teal-600", bg:"bg-emerald-50 dark:bg-emerald-950/20", border:"border-emerald-200 dark:border-emerald-900", desc:"Team management — assign to team & track", roleNames:["MANAGER","HR_MANAGER","TEAM_LEAD"], deptNames:[] },
  technical: { title:"Technical Department", icon:Code, color:"from-violet-600 to-indigo-600", bg:"bg-violet-50 dark:bg-violet-950/20", border:"border-violet-200 dark:border-violet-900", desc:"Engineering — Development, Infrastructure, Design", roleNames:[], deptNames:["Technical","Development","Infrastructure","Design"] },
};

export default function WorkspacePage(){
  const params = useParams();
  const roleKey = (params.role as string)?.toLowerCase();
  const cfg = roleConfig[roleKey] || roleConfig["founder"];
  const Icon = cfg.icon;

  const [tab,setTab]=useState<"overview"|"give"|"chat"|"updates"|"requests">("overview");
  const [staff,setStaff]=useState<any[]>([]);
  const [me,setMe]=useState<any>(null);
  const [tasks,setTasks]=useState<any[]>([]);
  const [activity,setActivity]=useState<any[]>([]);
  const [talkRequests,setTalkRequests]=useState<any[]>([]);
  const [workRequests,setWorkRequests]=useState<any[]>([]);
  const [chatPeer,setChatPeer]=useState<string>("");
  const [chatMessages,setChatMessages]=useState<any[]>([]);
  const [chatInput,setChatInput]=useState("");
  const [giveForm,setGiveForm]=useState({ title:"", description:"", assignTo:"", priority:"Medium", deadline:"", reward:"" });
  const [talkForm,setTalkForm]=useState({ reason:"", preferredTime:"" });
  const [workForm,setWorkForm]=useState({ title:"", description:"", priority:"Medium", deadline:"" });

  // load staff and me
  useEffect(()=>{
    fetch("/api/staff?limit=100").then(r=>r.json()).then(d=>{
      const list=d.data||[];
      setStaff(list);
      // try to find me as first staff with matching role, or first staff
      const candidate = list.find((s:any)=> cfg.roleNames.includes((s.role?.name||"").toUpperCase())) || list.find((s:any)=> cfg.deptNames.includes(s.department?.name)) || list[0];
      setMe(candidate||null);
      if(candidate) setChatPeer(candidate.id);
    });
    fetch("/api/tasks?limit=20").then(r=>r.json()).then(d=> setTasks(d.data||[]));
    fetch("/api/dashboard").then(r=>r.json()).then(d=> setActivity(d.activity||[]));
  },[roleKey]);

  // load chat
  useEffect(()=>{
    if(!me || !chatPeer) return;
    fetch(`/api/chat?userId=${me.id}&peerId=${chatPeer}`).then(r=>r.json()).then(d=> setChatMessages(d.data||[]));
  },[me, chatPeer]);

  const loadRequests=()=>{
    if(!me) return;
    fetch(`/api/talk-requests?targetId=${me.id}`).then(r=>r.json()).then(d=> setTalkRequests(d.data||[]));
    fetch(`/api/work-requests?targetId=${me.id}`).then(r=>r.json()).then(d=> setWorkRequests(d.data||[]));
  };
  useEffect(()=>{ loadRequests(); },[me]);

  async function giveWork(e:React.FormEvent){
    e.preventDefault();
    if(!giveForm.title || !giveForm.assignTo) return alert("Title and assignee required");
    const res=await fetch("/api/tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ title: giveForm.title, description: giveForm.description, priority: giveForm.priority, deadline: giveForm.deadline||null, reward: parseFloat(giveForm.reward)||0, assignedTo:[giveForm.assignTo], departmentId: null })});
    const j=await res.json();
    if(!res.ok) return alert(j.error);
    alert(`Work assigned! ${j.data.taskId} → ${staff.find(s=> s.id===giveForm.assignTo)?.name}`);
    setGiveForm({ title:"", description:"", assignTo:"", priority:"Medium", deadline:"", reward:"" });
    fetch("/api/tasks?limit=20").then(r=>r.json()).then(d=> setTasks(d.data||[]));
  }

  async function sendChat(){
    if(!chatInput.trim() || !me || !chatPeer) return;
    await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ senderId: me.id, recipientId: chatPeer, content: chatInput })});
    setChatInput("");
    fetch(`/api/chat?userId=${me.id}&peerId=${chatPeer}`).then(r=>r.json()).then(d=> setChatMessages(d.data||[]));
  }

  async function requestTalk(){
    if(!talkForm.reason.trim() || !me) return alert("Reason required");
    // for demo, request from first other staff to me
    const requester = staff.find(s=> s.id!==me.id) || staff[0];
    if(!requester) return alert("No staff to create request from");
    const res=await fetch("/api/talk-requests",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ requesterId: requester.id, targetId: me.id, targetRole: cfg.title, reason: talkForm.reason, preferredTime: talkForm.preferredTime })});
    const j=await res.json();
    if(!res.ok) return alert(j.error);
    setTalkForm({ reason:"", preferredTime:"" });
    loadRequests();
    alert("Talk request sent to "+cfg.title);
  }

  async function requestWork(){
    if(!workForm.title.trim() || !me) return alert("Title required");
    const requester = staff.find(s=> s.id!==me.id) || staff[0];
    if(!requester) return alert("No staff");
    const res=await fetch("/api/work-requests",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ requesterId: requester.id, targetId: me.id, targetRole: cfg.title, title: workForm.title, description: workForm.description, priority: workForm.priority, deadline: workForm.deadline||null })});
    const j=await res.json();
    if(!res.ok) return alert(j.error);
    setWorkForm({ title:"", description:"", priority:"Medium", deadline:"" });
    loadRequests();
    alert("Work request sent to "+cfg.title);
  }

  async function handleTalk(id:string, status:string){
    await fetch("/api/talk-requests",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({ id, status })});
    loadRequests();
  }
  async function handleWork(id:string, status:string){
    await fetch("/api/work-requests",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({ id, status })});
    loadRequests();
  }

  const scopedStaff = cfg.deptNames.length ? staff.filter(s=> cfg.deptNames.includes(s.department?.name)) : staff.filter(s=> cfg.roleNames.length===0 || cfg.roleNames.includes((s.role?.name||"").toUpperCase()) || roleKey==="founder");

  return (
    <div className="space-y-6">
      <div className={`rounded-3xl border-2 ${cfg.border} ${cfg.bg} p-6`}>
        <div className="flex items-start gap-4">
          <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${cfg.color} flex items-center justify-center text-white shadow-soft`}><Icon className="h-7 w-7"/></div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">{cfg.title} Workspace <Badge variant="outline" className="bg-white dark:bg-slate-900">{roleKey}</Badge></h1>
            <p className="text-sm text-muted-foreground">{cfg.desc} • Give work to anyone • Chat with anyone • Regular updates • Talk & Work requests</p>
            <div className="mt-2 flex gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3"/> {staff.length} total staff</Badge>
              <Badge variant="outline" className="gap-1"><ClipboardList className="h-3 w-3"/> {tasks.length} tasks</Badge>
              <Badge variant="outline" className="gap-1"><Activity className="h-3 w-3"/> Live DB</Badge>
            </div>
          </div>
          <div className="hidden lg:block text-right">
            <div className="text-xs text-muted-foreground">Acting as</div>
            <div className="font-medium">{me?.name||"—"}</div>
            <div className="text-xs text-muted-foreground">{me?.role?.name||""} • {me?.department?.name||""}</div>
            <Link href={`/staff/${me?.id||""}`}><Button size="sm" variant="outline" className="mt-2">View Profile</Button></Link>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {[
          {id:"overview", label:"Overview", icon:Activity},
          {id:"give", label:"Give Work", icon:FilePlus},
          {id:"chat", label:"Chat", icon:MessageCircle},
          {id:"updates", label:"Updates", icon:Clock},
          {id:"requests", label:"Requests", icon:Phone},
        ].map(t=>(
          <Button key={t.id} variant={tab===t.id?"default":"outline"} size="sm" onClick={()=> setTab(t.id as any)} className="gap-2 whitespace-nowrap"><t.icon className="h-4 w-4"/>{t.label}</Button>
        ))}
      </div>

      {tab==="overview" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4"/> {cfg.title} Team — Distinct Area</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              {scopedStaff.length===0 ? <div className="col-span-2 py-8 text-center text-sm text-muted-foreground">No staff in this area yet — assign staff to {cfg.title} role/department</div> : scopedStaff.slice(0,6).map(s=>(
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border bg-white dark:bg-slate-900">
                  <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center text-white text-xs font-bold`}>{s.name[0]}</div>
                  <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{s.name} <Badge variant="secondary" className="ml-1 text-[10px]">{s.status}</Badge></div><div className="text-xs text-muted-foreground truncate">{s.role?.name} • {s.department?.name}</div></div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Quick Stats</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Scope staff</span><span className="font-bold">{scopedStaff.length}</span></div>
              <div className="flex justify-between"><span>Pending talk requests</span><Badge variant="warning">{talkRequests.filter(r=> r.status==="Pending").length}</Badge></div>
              <div className="flex justify-between"><span>Pending work requests</span><Badge variant="warning">{workRequests.filter(r=> r.status==="Pending").length}</Badge></div>
              <div className="flex justify-between"><span>Tasks</span><span>{tasks.length}</span></div>
              <Link href="/applications"><Button size="sm" variant="outline" className="w-full mt-2">View Applications</Button></Link>
            </CardContent>
          </Card>
        </div>
      )}

      {tab==="give" && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FilePlus className="h-5 w-5 text-blue-600"/> Give Work — Assign to Anyone</CardTitle><p className="text-sm text-muted-foreground">Founder can give work to anyone in the portal. Same for Co-founder, CEO, Manager, Technical within their scope — all real DB tasks.</p></CardHeader>
          <CardContent>
            <form onSubmit={giveWork} className="space-y-4 max-w-2xl">
              <div className="space-y-1"><Label>Assign To *</Label><select value={giveForm.assignTo} onChange={e=> setGiveForm({...giveForm, assignTo:e.target.value})} className="w-full h-9 rounded-xl border bg-background px-3 text-sm" required><option value="">Select staff (anyone)...</option>{staff.map(s=> <option key={s.id} value={s.id}>{s.name} — {s.role?.name} • {s.department?.name} • {s.status}</option>)}</select></div>
              <div className="space-y-1"><Label>Title *</Label><Input value={giveForm.title} onChange={e=> setGiveForm({...giveForm, title:e.target.value})} required placeholder="Deploy server, fix bug, design page..." /></div>
              <div className="space-y-1"><Label>Description</Label><Textarea value={giveForm.description} onChange={e=> setGiveForm({...giveForm, description:e.target.value})} placeholder="What needs to be done..." rows={3}/></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label>Priority</Label><select value={giveForm.priority} onChange={e=> setGiveForm({...giveForm, priority:e.target.value})} className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></div>
                <div className="space-y-1"><Label>Deadline</Label><Input type="date" value={giveForm.deadline} onChange={e=> setGiveForm({...giveForm, deadline:e.target.value})} /></div>
                <div className="space-y-1"><Label>Reward (₹)</Label><Input type="number" value={giveForm.reward} onChange={e=> setGiveForm({...giveForm, reward:e.target.value})} placeholder="500"/></div>
              </div>
              <Button type="submit" className="gap-2"><ClipboardList className="h-4 w-4"/> Assign Work</Button>
              <div className="text-xs text-muted-foreground">Creates real Task (ZYP-xxx) → assignee gets notification + email (if enabled) + appears in /tasks/board.</div>
            </form>
          </CardContent>
        </Card>
      )}

      {tab==="chat" && (
        <div className="grid lg:grid-cols-3 gap-4 h-[480px]">
          <Card className="overflow-hidden flex flex-col">
            <CardHeader className="py-3 shrink-0"><CardTitle className="text-sm flex items-center gap-2"><MessageCircle className="h-4 w-4"/> Chat with Anyone</CardTitle><p className="text-xs text-muted-foreground">All staff — Founder can chat with anyone, same for others</p></CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-1 p-2">
              {staff.map(s=>(
                <button key={s.id} onClick={()=> setChatPeer(s.id)} className={`w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 ${chatPeer===s.id?"bg-slate-900 text-white dark:bg-white dark:text-slate-900":""}`}>
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-white text-xs font-bold">{s.name[0]}</div>
                  <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{s.name}</div><div className="text-xs opacity-70 truncate">{s.role?.name} • {s.status}</div></div>
                </button>
              ))}
              {staff.length===0 && <div className="text-xs text-muted-foreground py-6 text-center">No staff to chat</div>}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 flex flex-col overflow-hidden">
            <CardHeader className="py-3 shrink-0 border-b"><CardTitle className="text-sm flex items-center gap-2"><MessageCircle className="h-4 w-4"/> {staff.find(s=> s.id===chatPeer)?.name||"Select chat"} <Badge variant="outline" className="ml-auto">{chatMessages.length} msgs</Badge></CardTitle></CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
              {chatMessages.length===0 ? <div className="py-12 text-center text-sm text-muted-foreground">No messages yet — start chatting. Real DB ChatMessage.</div> : chatMessages.map(m=>(
                <div key={m.id} className={`flex ${m.senderId===me?.id?"justify-end":"justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.senderId===me?.id?"bg-blue-600 text-white":"bg-white dark:bg-slate-800 border"}`}>
                    <div>{m.content}</div>
                    <div className="text-[11px] opacity-70 mt-1">{new Date(m.createdAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</div>
                  </div>
                </div>
              ))}
            </CardContent>
            <div className="p-3 border-t flex gap-2">
              <Input value={chatInput} onChange={e=> setChatInput(e.target.value)} placeholder="Type a message..." onKeyDown={e=> e.key==="Enter" && sendChat()} className="flex-1"/>
              <Button onClick={sendChat} className="gap-2"><Send className="h-4 w-4"/> Send</Button>
            </div>
          </Card>
        </div>
      )}

      {tab==="updates" && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5"/> Regular Updates — {cfg.title}</CardTitle><p className="text-sm text-muted-foreground">Live activity for this work area • Polls /api/dashboard & tasks</p></CardHeader>
          <CardContent className="space-y-3">
            {activity.length===0 ? <div className="py-8 text-center text-sm text-muted-foreground">No updates yet — tasks, payouts, tickets will appear here</div> : activity.slice(0,10).map((a:any)=>(
              <div key={a.id} className="flex gap-3 p-3 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800">
                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"><Activity className="h-4 w-4 text-slate-500"/></div>
                <div className="flex-1"><div className="text-sm font-medium">{a.action}</div><div className="text-xs text-muted-foreground">{a.details||""}</div><div className="text-[11px] text-muted-foreground mt-1">{new Date(a.createdAt).toLocaleString("en-IN")}</div></div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab==="requests" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4 text-blue-600"/> Request to Talk with {cfg.title}</CardTitle><p className="text-xs text-muted-foreground">Anyone can request a talk — appears in {cfg.title} inbox</p></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1"><Label>Reason *</Label><Textarea value={talkForm.reason} onChange={e=> setTalkForm({...talkForm, reason:e.target.value})} placeholder="I need to discuss..." rows={3}/></div>
                <div className="space-y-1"><Label>Preferred time</Label><Input value={talkForm.preferredTime} onChange={e=> setTalkForm({...talkForm, preferredTime:e.target.value})} placeholder="Tomorrow 3pm IST"/></div>
                <Button onClick={requestTalk} className="w-full gap-2"><Phone className="h-4 w-4"/> Send Talk Request</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><FilePlus className="h-4 w-4 text-emerald-600"/> Request Work to be Done by {cfg.title}</CardTitle><p className="text-xs text-muted-foreground">Send a work request — {cfg.title} can accept and it becomes a Task</p></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1"><Label>Title *</Label><Input value={workForm.title} onChange={e=> setWorkForm({...workForm, title:e.target.value})} placeholder="Need help with..." /></div>
                <div className="space-y-1"><Label>Description *</Label><Textarea value={workForm.description} onChange={e=> setWorkForm({...workForm, description:e.target.value})} rows={3} placeholder="Details..."/></div>
                <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label>Priority</Label><select value={workForm.priority} onChange={e=> setWorkForm({...workForm, priority:e.target.value})} className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></div><div className="space-y-1"><Label>Deadline</Label><Input type="date" value={workForm.deadline} onChange={e=> setWorkForm({...workForm, deadline:e.target.value})}/></div></div>
                <Button onClick={requestWork} className="w-full gap-2"><ClipboardList className="h-4 w-4"/> Send Work Request</Button>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Phone className="h-4 w-4"/> Inbox — Talk Requests to {cfg.title} <Badge variant="secondary">{talkRequests.length}</Badge></CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-[320px] overflow-y-auto">
                {talkRequests.length===0 ? <div className="text-sm text-muted-foreground py-6 text-center">No talk requests yet</div> : talkRequests.map((r:any)=>(
                  <div key={r.id} className="p-3 rounded-xl border">
                    <div className="flex justify-between"><span className="text-sm font-medium">{r.requester?.name}</span><Badge variant={r.status==="Pending"?"warning": r.status==="Accepted"?"success":"secondary"}>{r.status}</Badge></div>
                    <div className="text-xs text-muted-foreground mt-1">{r.reason}</div>
                    <div className="text-xs text-muted-foreground">Preferred: {r.preferredTime||"—"} • {new Date(r.createdAt).toLocaleString("en-IN")}</div>
                    {r.status==="Pending" && <div className="flex gap-2 mt-2"><Button size="sm" onClick={()=> handleTalk(r.id,"Accepted")} className="gap-1 bg-emerald-600"><CheckCircle className="h-4 w-4"/> Accept</Button><Button size="sm" variant="outline" onClick={()=> handleTalk(r.id,"Rejected")} className="gap-1"><XCircle className="h-4 w-4"/> Reject</Button></div>}
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4"/> Inbox — Work Requests <Badge variant="secondary">{workRequests.length}</Badge></CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-[320px] overflow-y-auto">
                {workRequests.length===0 ? <div className="text-sm text-muted-foreground py-6 text-center">No work requests yet</div> : workRequests.map((r:any)=>(
                  <div key={r.id} className="p-3 rounded-xl border">
                    <div className="flex justify-between"><span className="text-sm font-medium">{r.title}</span><Badge variant={r.status==="Pending"?"warning": r.status==="Accepted"?"success":"secondary"}>{r.status}</Badge></div>
                    <div className="text-xs text-muted-foreground">{r.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">{r.requester?.name} • {r.priority} • {r.deadline? new Date(r.deadline).toLocaleDateString("en-IN"):"No deadline"}</div>
                    {r.status==="Pending" && <div className="flex gap-2 mt-2"><Button size="sm" onClick={()=> handleWork(r.id,"Accepted")} className="gap-1 bg-emerald-600"><CheckCircle className="h-4 w-4"/> Accept → Creates Task</Button><Button size="sm" variant="outline" onClick={()=> handleWork(r.id,"Rejected")}><XCircle className="h-4 w-4"/> Reject</Button></div>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
