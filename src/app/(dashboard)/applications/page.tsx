"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, CheckCircle, XCircle, Clock, FileText } from "lucide-react";

export default function ApplicationsPage(){
  const [apps,setApps]=useState<any[]>([]);
  const [total,setTotal]=useState(0);
  const [search,setSearch]=useState("");
  const [statusFilter,setStatusFilter]=useState("");
  const [loading,setLoading]=useState(true);

  const load=()=>{
    setLoading(true);
    const params=new URLSearchParams({ search, status:statusFilter });
    fetch(`/api/applications?${params}`).then(r=>r.json()).then(d=>{
      setApps(d.data||[]); setTotal(d.total||0);
    }).finally(()=> setLoading(false));
  };
  useEffect(()=>{ load(); },[search,statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Staff Applications</h1>
          <p className="text-sm text-muted-foreground">{total} applications • Review, approve or reject — creates audit logs & emails</p>
        </div>
        <div className="flex gap-2">
          <Link href="/apply" target="_blank"><Button variant="outline">View Apply Form</Button></Link>
          <Button variant="outline" onClick={load}>Refresh</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input placeholder="Search name, email, ID..." className="pl-9" value={search} onChange={e=> setSearch(e.target.value)}/></div>
          <select value={statusFilter} onChange={e=> setStatusFilter(e.target.value)} className="h-9 rounded-xl border bg-background px-3 text-sm">
            <option value="">All statuses</option><option>Pending</option><option>Under Review</option><option>Approved</option><option>Rejected</option><option>Withdrawn</option>
          </select>
        </CardContent>
      </Card>

      {loading ? <div className="h-64 skeleton rounded-2xl"/> : apps.length===0 ? (
        <Card><CardContent className="py-12 text-center">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto"><FileText className="h-6 w-6 text-muted-foreground"/></div>
          <div className="mt-3 font-medium">No applications yet</div>
          <div className="text-sm text-muted-foreground">When candidates apply via /apply, they’ll appear here with 2-step details (personal + questions), ID proof and photo.</div>
          <Link href="/apply"><Button className="mt-4">Go to Apply Form</Button></Link>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {apps.map((a:any)=>(
            <Card key={a.id} className="card-hover">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4">
                  <img src={a.photoUrl} alt={a.name} className="h-16 w-16 rounded-xl object-cover border" onError={e=> (e.currentTarget.style.display='none')} />
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">{a.applicationId}</span>
                      <Badge variant={a.status==="Approved"?"success": a.status==="Rejected"?"destructive": a.status==="Pending"?"warning":"secondary"}>{a.status}</Badge>
                      <span className="text-sm font-medium">{a.name}</span>
                      <span className="text-xs text-muted-foreground">• {a.email} • {a.phone}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">DOB: {new Date(a.dob).toLocaleDateString("en-IN")} • {a.state}, {a.country} • {a.identityType}: {a.identityNumber}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.address} {a.city? `, ${a.city}`:""}</div>
                    <div className="flex gap-2 mt-2">
                      <a href={a.identityProofUrl} target="_blank" className="text-xs text-blue-600 underline">Identity Proof</a>
                      <span className="text-xs text-muted-foreground">•</span>
                      <a href={a.photoUrl} target="_blank" className="text-xs text-blue-600 underline">Photo</a>
                      <span className="text-xs text-muted-foreground">• {new Date(a.createdAt).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Link href={`/applications/${a.id}`}><Button size="sm" variant="outline" className="gap-1 w-full"><Eye className="h-4 w-4"/> View</Button></Link>
                    {a.status==="Pending" || a.status==="Under Review" ? (
                      <div className="flex gap-1">
                        <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={async()=>{
                          await fetch(`/api/applications/${a.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"Approved"})});
                          load();
                        }}><CheckCircle className="h-4 w-4"/> Approve</Button>
                        <Button size="sm" variant="destructive" className="gap-1" onClick={async()=>{
                          const notes=prompt("Reject reason?");
                          await fetch(`/api/applications/${a.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"Rejected", reviewNotes: notes||"Not suitable"})});
                          load();
                        }}><XCircle className="h-4 w-4"/> Reject</Button>
                      </div>
                    ) : <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3"/> {a.reviewedAt? new Date(a.reviewedAt).toLocaleDateString("en-IN"):""}</div>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
