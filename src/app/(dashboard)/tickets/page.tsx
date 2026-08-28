"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export default function TicketsPage(){
  const [tickets,setTickets]=useState<any[]>([]);
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({customer:"",subject:"",category:"General",priority:"Medium"});
  const load=()=> fetch("/api/tickets").then(r=>r.json()).then(d=> setTickets(d.data||[]));
  useEffect(()=>{ load(); },[]);
  async function create(e:React.FormEvent){
    e.preventDefault();
    const res=await fetch("/api/tickets",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    if(!res.ok){ const j=await res.json(); alert(j.error); return; }
    setShowAdd(false); load();
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-semibold">Tickets</h1><p className="text-sm text-muted-foreground">Support ticket assignment & SLA tracking</p></div><Button onClick={()=> setShowAdd(true)} className="gap-2"><Plus className="h-4 w-4"/> New Ticket</Button></div>
      <div className="grid gap-3">
        {tickets.map((t:any)=>(
          <Card key={t.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2"><span className="font-mono text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">{t.ticketId}</span><Badge variant={t.status==="Open"?"warning": t.status==="Resolved"?"success":"secondary"}>{t.status}</Badge><Badge variant="outline">{t.priority}</Badge></div>
                <div className="font-medium text-sm mt-1">{t.subject}</div>
                <div className="text-xs text-muted-foreground">{t.customer} • {t.category} • {new Date(t.createdAt).toLocaleDateString("en-IN")} • Assigned: {t.assignments?.[0]?.user?.name||"Unassigned"}</div>
              </div>
              <Button size="sm" variant="outline">Assign</Button>
            </CardContent>
          </Card>
        ))}
        {tickets.length===0 && <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">No tickets</CardContent></Card>}
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={()=> setShowAdd(false)}>
          <form onSubmit={create} onClick={e=> e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xl">
            <h3 className="font-semibold">Create Ticket</h3>
            <div className="space-y-1"><Label>Customer Email</Label><Input value={form.customer} onChange={e=> setForm({...form,customer:e.target.value})} required placeholder="customer@example.com"/></div>
            <div className="space-y-1"><Label>Subject</Label><Input value={form.subject} onChange={e=> setForm({...form,subject:e.target.value})} required placeholder="VPS not starting"/></div>
            <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label>Category</Label><select value={form.category} onChange={e=> setForm({...form,category:e.target.value})} className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option>General</option><option>Technical</option><option>Billing</option><option>Domain</option></select></div><div className="space-y-1"><Label>Priority</Label><select value={form.priority} onChange={e=> setForm({...form,priority:e.target.value})} className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></div></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=> setShowAdd(false)}>Cancel</Button><Button type="submit">Create</Button></div>
          </form>
        </div>
      )}
    </div>
  );
}
