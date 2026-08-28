"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Calendar, IndianRupee } from "lucide-react";

const statusColors:any={ Backlog:"secondary", Assigned:"secondary", Accepted:"secondary", "In Progress":"warning", Waiting:"secondary", Submitted:"warning", "Under Review":"warning", Approved:"success", Rejected:"destructive", Completed:"success", Cancelled:"secondary" };
const priorityColors:any={ Low:"secondary", Medium:"secondary", High:"warning", Urgent:"destructive" };

export default function TasksPage(){
  const [tasks,setTasks]=useState<any[]>([]);
  const [search,setSearch]=useState("");
  const [statusFilter,setStatusFilter]=useState("");
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({title:"",description:"",priority:"Medium",reward:"",deadline:"",checklist:""});
  const load=()=>{ const p=new URLSearchParams({search, status:statusFilter}); fetch(`/api/tasks?${p}`).then(r=>r.json()).then(d=> setTasks(d.data||[])); };
  useEffect(()=>{ load(); },[search,statusFilter]);
  async function createTask(e:React.FormEvent){
    e.preventDefault();
    const checklist=form.checklist.split("\n").filter(Boolean);
    const res=await fetch("/api/tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:form.title,description:form.description,priority:form.priority,reward:parseFloat(form.reward)||0,deadline:form.deadline||null,checklist})});
    if(!res.ok){ const j=await res.json(); alert(j.error); return; }
    setShowAdd(false); setForm({title:"",description:"",priority:"Medium",reward:"",deadline:"",checklist:""}); load();
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Tasks</h1><p className="text-sm text-muted-foreground">Linear-style task management • Real database</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={()=> window.location.href="/tasks/board"}>Kanban Board</Button><Button onClick={()=> setShowAdd(true)} className="gap-2"><Plus className="h-4 w-4"/> New Task</Button></div>
      </div>
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input placeholder="Search tasks..." className="pl-9" value={search} onChange={e=> setSearch(e.target.value)}/></div>
          <select value={statusFilter} onChange={e=> setStatusFilter(e.target.value)} className="h-9 rounded-xl border bg-background px-3 text-sm">
            <option value="">All statuses</option><option>Backlog</option><option>Assigned</option><option>In Progress</option><option>Under Review</option><option>Completed</option>
          </select>
          <Button variant="outline" onClick={load}>Refresh</Button>
        </CardContent>
      </Card>
      <div className="grid gap-3">
        {tasks.map(t=>(
          <Card key={t.id} className="card-hover">
            <CardContent className="p-4 flex gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-medium px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">{t.taskId}</span>
                  <Badge variant={priorityColors[t.priority]||"secondary"} className="text-[10px]">{t.priority}</Badge>
                  <Badge variant={statusColors[t.status]||"secondary"} className="text-[10px]">{t.status}</Badge>
                  {t.reward? <span className="text-xs flex items-center gap-1 text-emerald-600"><IndianRupee className="h-3 w-3"/> {t.reward}</span>: null}
                </div>
                <div className="font-medium mt-2">{t.title}</div>
                <div className="text-sm text-muted-foreground line-clamp-2">{t.description}</div>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3"/>{t.deadline? new Date(t.deadline).toLocaleDateString("en-IN"): "No deadline"}</span>
                  <span>Dept: {t.department?.name||"—"}</span>
                  <span>Assignee: {t.assignments?.[0]?.user?.name||"Unassigned"}</span>
                </div>
                {t.checklist?.length? <div className="mt-2 text-xs"><div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-primary" style={{width:`${Math.round(t.checklist.filter((c:any)=>c.completed).length/t.checklist.length*100)}%`}}/></div><span>{t.checklist.filter((c:any)=>c.completed).length}/{t.checklist.length} checklist</span></div>: null}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={()=> alert(`Task ${t.taskId}: status update would call PATCH /api/tasks/${t.id}`)}>Update</Button>
                <Button size="sm" variant="ghost" onClick={()=> alert(`Comments for ${t.taskId} — opens discussion thread`)}>Comments</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {tasks.length===0 && <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">No tasks found. Create your first task.</CardContent></Card>}
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={()=> setShowAdd(false)}>
          <form onSubmit={createTask} onClick={e=> e.stopPropagation()} className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl my-8">
            <h3 className="font-semibold text-lg">Create Task</h3>
            <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={e=> setForm({...form,title:e.target.value})} required placeholder="Deploy new server template"/></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={e=> setForm({...form,description:e.target.value})} placeholder="Detailed description..."/></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label>Priority</Label><select value={form.priority} onChange={e=> setForm({...form,priority:e.target.value})} className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></div>
              <div className="space-y-1"><Label>Reward (₹)</Label><Input type="number" value={form.reward} onChange={e=> setForm({...form,reward:e.target.value})} placeholder="500"/></div>
              <div className="space-y-1"><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={e=> setForm({...form,deadline:e.target.value})}/></div>
            </div>
            <div className="space-y-1"><Label>Checklist (one per line)</Label><Textarea value={form.checklist} onChange={e=> setForm({...form,checklist:e.target.value})} placeholder={"Complete implementation\nTest functionality\nWrite documentation"} rows={3}/></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=> setShowAdd(false)}>Cancel</Button><Button type="submit">Create Task</Button></div>
          </form>
        </div>
      )}
    </div>
  );
}
