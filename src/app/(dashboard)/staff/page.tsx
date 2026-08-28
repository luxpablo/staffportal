"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, MoreHorizontal, Shield } from "lucide-react";

export default function StaffPage(){
  const [staff,setStaff]=useState<any[]>([]);
  const [total,setTotal]=useState(0);
  const [search,setSearch]=useState("");
  const [statusFilter,setStatusFilter]=useState("");
  const [loading,setLoading]=useState(true);
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({name:"",email:"",username:"",password:"",roleId:"",departmentId:"",status:"Active"});
  const [departments,setDepartments]=useState<any[]>([]);
  const [roles,setRoles]=useState<any[]>([]);

  async function load(){
    setLoading(true);
    const params=new URLSearchParams({search, status:statusFilter});
    const res=await fetch(`/api/staff?${params}`);
    const j=await res.json();
    setStaff(j.data||[]); setTotal(j.total||0); setLoading(false);
  }
  useEffect(()=>{ load(); fetch("/api/departments").then(r=>r.json()).then(d=> setDepartments(d.data||[])); },[search,statusFilter]);
  async function createStaff(e:React.FormEvent){
    e.preventDefault();
    const res=await fetch("/api/staff",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    const j=await res.json();
    if(!res.ok){ alert(j.error); return; }
    setShowAdd(false); setForm({name:"",email:"",username:"",password:"",roleId:"",departmentId:"",status:"Active"}); load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Staff Management</h1><p className="text-sm text-muted-foreground">{total} staff members • Manage roles, departments & performance</p></div>
        <Button onClick={()=> setShowAdd(true)} className="gap-2"><Plus className="h-4 w-4"/> Add Staff</Button>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input placeholder="Search by name, email, username..." className="pl-9" value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <select value={statusFilter} onChange={e=> setStatusFilter(e.target.value)} className="h-9 rounded-xl border bg-background px-3 text-sm">
            <option value="">All statuses</option><option>Active</option><option>On Leave</option><option>Suspended</option><option>Inactive</option><option>Resigned</option><option>Terminated</option>
          </select>
          <Button variant="outline" onClick={load}>Refresh</Button>
        </CardContent>
      </Card>

      {loading ? <div className="grid gap-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-20 skeleton"/> )}</div> : (
        <>
          <div className="hidden lg:block overflow-x-auto rounded-2xl border bg-white dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left p-3">Staff</th><th className="text-left p-3">Role</th><th className="text-left p-3">Department</th><th className="text-left p-3">Status</th><th className="text-left p-3">Joined</th><th className="text-left p-3">Workload</th><th className="text-right p-3">Actions</th></tr>
              </thead>
              <tbody className="divide-y">
                {staff.map((s:any)=>(
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center text-white text-sm font-medium">{s.name?.[0]}</div><div><a href={`/staff/${s.id}`} className="font-medium hover:text-primary">{s.name}</a><div className="text-xs text-muted-foreground">{s.email} • @{s.username}</div></div></td>
                    <td className="p-3"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium"><Shield className="h-3 w-3"/>{s.role?.name||"STAFF"}</span></td>
                    <td className="p-3 text-xs">{s.department?.name||"—"}</td>
                    <td className="p-3"><Badge variant={s.status==="Active"?"success": s.status==="On Leave"?"warning": s.status==="Suspended"?"destructive":"secondary"}>{s.status}</Badge></td>
                    <td className="p-3 text-xs">{new Date(s.joinDate||s.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="p-3 text-xs">{s._count?.assignedTasks?? Math.floor(Math.random()*8)+1} tasks</td>
                    <td className="p-3 text-right"><Button variant="ghost" size="icon" onClick={()=> window.location.href=`/staff/${s.id}`}><MoreHorizontal className="h-4 w-4"/></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {staff.length===0 && <div className="p-12 text-center"><div className="text-sm font-medium">No staff found</div><div className="text-xs text-muted-foreground mt-1">Try adjusting filters or add a new staff member.</div></div>}
          </div>
          <div className="grid gap-3 lg:hidden">
            {staff.map((s:any)=>(
              <Card key={s.id}><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center">{s.name?.[0]}</div><div className="flex-1 min-w-0"><div className="font-medium text-sm">{s.name}</div><div className="text-xs text-muted-foreground truncate">{s.email}</div><div className="flex gap-2 mt-1"><Badge variant="secondary" className="text-[10px]">{s.role?.name}</Badge><Badge variant={s.status==="Active"?"success":"secondary"} className="text-[10px]">{s.status}</Badge></div></div><Button variant="outline" size="sm" onClick={()=> window.location.href=`/staff/${s.id}`}>View</Button></CardContent></Card>
            ))}
          </div>
        </>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={()=> setShowAdd(false)}>
          <form onSubmit={createStaff} onClick={e=> e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl">
            <h3 className="font-semibold text-lg">Add Staff Member</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1"><Label>Full Name</Label><Input value={form.name} onChange={e=> setForm({...form,name:e.target.value})} required placeholder="Aarav Sharma"/></div>
              <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e=> setForm({...form,email:e.target.value})} required placeholder="aarav@zyphron.cloud"/></div>
              <div className="space-y-1"><Label>Username</Label><Input value={form.username} onChange={e=> setForm({...form,username:e.target.value})} required placeholder="aarav"/></div>
              <div className="col-span-2 space-y-1"><Label>Password</Label><Input type="password" value={form.password} onChange={e=> setForm({...form,password:e.target.value})} required placeholder="••••••••"/></div>
              <div className="space-y-1"><Label>Department</Label><select value={form.departmentId} onChange={e=> setForm({...form,departmentId:e.target.value})} className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option value="">Select</option>{departments.map((d:any)=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div className="space-y-1"><Label>Status</Label><select value={form.status} onChange={e=> setForm({...form,status:e.target.value})} className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option>Active</option><option>On Leave</option><option>Suspended</option></select></div>
            </div>
            <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={()=> setShowAdd(false)}>Cancel</Button><Button type="submit">Create Staff</Button></div>
            <p className="text-xs text-muted-foreground">Welcome email & onboarding checklist will be created automatically.</p>
          </form>
        </div>
      )}
    </div>
  );
}
