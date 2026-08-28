"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, Clock, IndianRupee } from "lucide-react";

export default function PayoutsPage(){
  const [payouts,setPayouts]=useState<any[]>([]);
  const [filter,setFilter]=useState("");
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({userId:"",amount:"",type:"Task reward",description:"",paymentMethod:"Bank"});
  const [staff,setStaff]=useState<any[]>([]);
  const load=()=>{ const q=filter? `?status=${filter}`:""; fetch(`/api/payouts${q}`).then(r=>r.json()).then(d=> setPayouts(d.data||[])); };
  useEffect(()=>{ load(); fetch("/api/staff").then(r=>r.json()).then(d=> setStaff(d.data||[])); },[filter]);
  async function createPayout(e:React.FormEvent){
    e.preventDefault();
    const res=await fetch("/api/payouts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    if(!res.ok){ const j=await res.json(); alert(j.error); return; }
    setShowAdd(false); load();
  }
  const statusColor:any={Pending:"warning",Approved:"secondary",Processing:"secondary",Paid:"success",Failed:"destructive",Cancelled:"secondary"};
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Payouts</h1><p className="text-sm text-muted-foreground">Approval workflow: Pending → Approved → Processing → Paid</p></div>
        <Button onClick={()=> setShowAdd(true)} className="gap-2"><Plus className="h-4 w-4"/> Create Payout</Button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {["","Pending","Approved","Paid"].map(s=> <Button key={s||"all"} variant={filter===s?"default":"outline"} size="sm" onClick={()=> setFilter(s)}>{s||"All"}</Button>)}
      </div>
      <div className="grid gap-3">
        {payouts.map(p=>(
          <Card key={p.id}>
            <CardContent className="p-4 flex flex-wrap items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white"><IndianRupee className="h-5 w-5"/></div>
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2"><span className="font-mono text-sm font-medium">{p.payoutId}</span><Badge variant={statusColor[p.status]||"secondary"}>{p.status}</Badge><span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">{p.type}</span></div>
                <div className="text-sm font-medium mt-1">₹{p.amount?.toLocaleString("en-IN")} • {p.user?.name}</div>
                <div className="text-xs text-muted-foreground">{p.description} {p.transactionId? `• TXN: ${p.transactionId}`: ""} • {new Date(p.createdAt).toLocaleDateString("en-IN")}</div>
              </div>
              <div className="flex gap-2">
                {p.status==="Pending" && <Button size="sm" className="gap-1" onClick={()=> alert("Approve would call PATCH /api/payouts/"+p.id)}><Check className="h-4 w-4"/> Approve</Button>}
                {p.status==="Approved" && <Button size="sm" variant="outline" onClick={()=> alert("Mark processing")}>Process</Button>}
                <Button size="sm" variant="ghost">History</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {payouts.length===0 && <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">No payouts found.</CardContent></Card>}
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={()=> setShowAdd(false)}>
          <form onSubmit={createPayout} onClick={e=> e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xl">
            <h3 className="font-semibold">Create Payout</h3>
            <div className="space-y-1"><Label>Staff</Label><select value={form.userId} onChange={e=> setForm({...form,userId:e.target.value})} required className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option value="">Select staff</option>{staff.map((s:any)=><option key={s.id} value={s.id}>{s.name} • {s.email}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label>Amount (₹)</Label><Input type="number" value={form.amount} onChange={e=> setForm({...form,amount:e.target.value})} required placeholder="5000"/></div><div className="space-y-1"><Label>Type</Label><select value={form.type} onChange={e=> setForm({...form,type:e.target.value})} className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option>Task reward</option><option>Commission</option><option>Salary</option><option>Bonus</option><option>Referral</option></select></div></div>
            <div className="space-y-1"><Label>Description</Label><Input value={form.description} onChange={e=> setForm({...form,description:e.target.value})} placeholder="ZYP-124 reward"/></div>
            <div className="space-y-1"><Label>Payment Method</Label><select value={form.paymentMethod} onChange={e=> setForm({...form,paymentMethod:e.target.value})} className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option>Bank</option><option>UPI</option><option>PayPal</option></select></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=> setShowAdd(false)}>Cancel</Button><Button type="submit">Create</Button></div>
          </form>
        </div>
      )}
    </div>
  );
}
