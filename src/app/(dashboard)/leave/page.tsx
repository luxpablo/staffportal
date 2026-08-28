"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export default function LeavePage(){
  const [leaves,setLeaves]=useState<any[]>([]);
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({type:"Casual",startDate:"",endDate:"",reason:""});
  const load=()=> fetch("/api/leave").then(r=>r.json()).then(d=> setLeaves(d.data||[]));
  useEffect(()=>{ load(); },[]);
  async function create(e:React.FormEvent){
    e.preventDefault();
    const staffRes=await fetch("/api/staff").then(r=>r.json());
    const staff=staffRes.data?.[0];
    if(!staff?.id){ alert("No staff found in database — create a staff member first"); return; }
    const userId=staff.id;
    const res=await fetch("/api/leave",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,userId})});
    if(!res.ok){ const j=await res.json(); alert(j.error); return; }
    setShowAdd(false); load();
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-semibold">Leave Management</h1><p className="text-sm text-muted-foreground">Request & approve leave • HR workflow</p></div><Button onClick={()=> setShowAdd(true)} className="gap-2"><Plus className="h-4 w-4"/> Request Leave</Button></div>
      <div className="grid gap-3">
        {leaves.map((l:any)=>(
          <Card key={l.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2"><span className="font-medium text-sm">{l.user?.name}</span><Badge variant="outline">{l.type}</Badge><Badge variant={l.status==="Pending"?"warning": l.status==="Approved"?"success":"destructive"}>{l.status}</Badge></div>
                <div className="text-xs text-muted-foreground mt-1">{new Date(l.startDate).toLocaleDateString("en-IN")} → {new Date(l.endDate).toLocaleDateString("en-IN")} • {l.reason}</div>
              </div>
              {l.status==="Pending" && <div className="flex gap-2"><Button size="sm" onClick={()=> alert("Approve leave")}>Approve</Button><Button size="sm" variant="outline" onClick={()=> alert("Reject leave")}>Reject</Button></div>}
            </CardContent>
          </Card>
        ))}
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={()=> setShowAdd(false)}>
          <form onSubmit={create} onClick={e=> e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xl">
            <h3 className="font-semibold">Request Leave</h3>
            <div className="space-y-1"><Label>Type</Label><select value={form.type} onChange={e=> setForm({...form,type:e.target.value})} className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option>Casual</option><option>Sick</option><option>Paid</option><option>Unpaid</option></select></div>
            <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label>Start</Label><Input type="date" value={form.startDate} onChange={e=> setForm({...form,startDate:e.target.value})} required/></div><div className="space-y-1"><Label>End</Label><Input type="date" value={form.endDate} onChange={e=> setForm({...form,endDate:e.target.value})} required/></div></div>
            <div className="space-y-1"><Label>Reason</Label><Textarea value={form.reason} onChange={e=> setForm({...form,reason:e.target.value})} placeholder="Family function"/></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=> setShowAdd(false)}>Cancel</Button><Button type="submit">Submit</Button></div>
          </form>
        </div>
      )}
    </div>
  );
}
