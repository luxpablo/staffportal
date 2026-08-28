"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Building2, Users, ClipboardList, Plus } from "lucide-react";

export default function DepartmentsPage(){
  const [depts,setDepts]=useState<any[]>([]);
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({name:"",description:"",budget:"",color:"#0ea5e9"});
  const load=()=> fetch("/api/departments").then(r=>r.json()).then(d=> setDepts(d.data||[]));
  useEffect(()=>{ load(); },[]);
  async function createDept(e:React.FormEvent){
    e.preventDefault();
    const res=await fetch("/api/departments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:form.name,description:form.description,budget:parseFloat(form.budget)||0,color:form.color})});
    if(!res.ok){ const j=await res.json(); alert(j.error); return; }
    setShowAdd(false); setForm({name:"",description:"",budget:"",color:"#0ea5e9"}); load();
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-semibold">Departments</h1><p className="text-sm text-muted-foreground">Manage organization structure & budgets</p></div><Button onClick={()=> setShowAdd(true)} className="gap-2"><Plus className="h-4 w-4"/> New Department</Button></div>
      {depts.length===0 ? (
        <Card><CardContent className="py-12 text-center"><div className="text-sm font-medium">No departments yet</div><div className="text-xs text-muted-foreground mt-1">Create your first department to organize staff and tasks.</div><Button className="mt-4 gap-2" onClick={()=> setShowAdd(true)}><Plus className="h-4 w-4"/> New Department</Button></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {depts.map(d=>(
            <Card key={d.id} className="card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white" style={{background:d.color}}><Building2 className="h-5 w-5"/></div>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">₹{(d.budget||0).toLocaleString("en-IN")}</span>
                </div>
                <CardTitle className="text-base mt-3">{d.name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">{d.description||"No description"}</p>
              </CardHeader>
              <CardContent className="flex gap-4 text-sm">
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-muted-foreground"/>{d._count?.members??0} members</span>
                <span className="flex items-center gap-1.5"><ClipboardList className="h-4 w-4 text-muted-foreground"/>{d._count?.tasks??0} tasks</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={()=> setShowAdd(false)}>
          <form onSubmit={createDept} onClick={e=> e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xl">
            <h3 className="font-semibold">Create Department</h3>
            <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={e=> setForm({...form,name:e.target.value})} required placeholder="Infrastructure"/></div>
            <div className="space-y-1"><Label>Description</Label><Input value={form.description} onChange={e=> setForm({...form,description:e.target.value})} placeholder="Servers & DevOps"/></div>
            <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label>Budget (₹)</Label><Input type="number" value={form.budget} onChange={e=> setForm({...form,budget:e.target.value})} placeholder="500000"/></div><div className="space-y-1"><Label>Color</Label><Input type="color" value={form.color} onChange={e=> setForm({...form,color:e.target.value})} className="h-9 p-1"/></div></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=> setShowAdd(false)}>Cancel</Button><Button type="submit">Create</Button></div>
          </form>
        </div>
      )}
    </div>
  );
}
