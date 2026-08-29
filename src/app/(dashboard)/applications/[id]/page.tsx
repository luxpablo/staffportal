"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { ArrowLeft, CheckCircle, XCircle, Clock, User, MapPin, FileCheck, Shield, Calendar, Phone, Mail } from "lucide-react";

export default function ApplicationDetailPage(){
  const { id } = useParams();
  const [app,setApp]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [notes,setNotes]=useState("");
  const [saving,setSaving]=useState(false);

  const load=()=> fetch(`/api/applications/${id}`).then(r=>r.json()).then(d=> {
    if(d.data) setApp(d.data);
    else setApp(null);
  }).finally(()=> setLoading(false));

  useEffect(()=>{ load(); },[id]);

  async function updateStatus(status:string){
    setSaving(true);
    try{
      const res=await fetch(`/api/applications/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({ status, reviewNotes: notes })});
      const j=await res.json();
      if(!res.ok) throw new Error(j.error);
      load();
    }catch(e:any){ alert(e.message); } finally{ setSaving(false); }
  }

  if(loading) return <div className="h-64 skeleton rounded-2xl"/>;
  if(!app) return <Card><CardContent className="py-12 text-center">Application not found</CardContent></Card>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Link href="/applications" className="hover:text-foreground flex items-center gap-1"><ArrowLeft className="h-4 w-4"/> Applications</Link><span>/</span><span className="text-foreground font-mono">{app.applicationId}</span></div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">{app.name} <Badge variant={app.status==="Approved"?"success": app.status==="Rejected"?"destructive":"warning"}>{app.status}</Badge></h1>
          <p className="text-sm text-muted-foreground">{app.email} • {app.phone} • Applied {new Date(app.createdAt).toLocaleString("en-IN")}</p>
        </div>
        <div className="flex gap-2">
          {app.status==="Pending" || app.status==="Under Review" ? (
            <>
              <Button onClick={()=> updateStatus("Approved")} disabled={saving} className="gap-2 bg-emerald-600 hover:bg-emerald-700"><CheckCircle className="h-4 w-4"/> Approve</Button>
              <Button onClick={()=> updateStatus("Rejected")} disabled={saving} variant="destructive" className="gap-2"><XCircle className="h-4 w-4"/> Reject</Button>
              <Button onClick={()=> updateStatus("Under Review")} disabled={saving} variant="outline" className="gap-2"><Clock className="h-4 w-4"/> Mark Review</Button>
            </>
          ) : <Badge variant="outline">Reviewed {app.reviewedAt? new Date(app.reviewedAt).toLocaleDateString("en-IN"):""}</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-6 text-center">
              <img src={app.photoUrl} alt={app.name} className="h-32 w-32 rounded-2xl object-cover border mx-auto" />
              <div className="mt-3 font-semibold">{app.name}</div>
              <div className="text-xs text-muted-foreground">{app.applicationId}</div>
              <Badge className="mt-2" variant={app.status==="Active"?"success":"secondary"}>{app.status}</Badge>
              <div className="mt-4 space-y-2 text-sm text-left">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground"/><span className="truncate">{app.email}</span></div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/><span>{app.phone}</span></div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground"/><span>DOB: {new Date(app.dob).toLocaleDateString("en-IN")}</span></div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground"/><span className="truncate">{app.address} {app.city? `, ${app.city}`:""}, {app.state}, {app.country} {app.pincode||""}</span></div>
                <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground"/><span>{app.identityType}: {app.identityNumber}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <a href={app.photoUrl} target="_blank"><Button variant="outline" size="sm" className="w-full">View Photo</Button></a>
                <a href={app.identityProofUrl} target="_blank"><Button variant="outline" size="sm" className="w-full">Identity Proof</Button></a>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Review Notes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={notes} onChange={e=> setNotes(e.target.value)} placeholder="Add review notes..." rows={3} defaultValue={app.reviewNotes||""}/>
              <div className="text-xs text-muted-foreground">{app.reviewNotes? `Previous: ${app.reviewNotes}`:"No notes yet"}</div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4"/> Personal Details (Step 1)</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Name</span><div className="font-medium">{app.name}</div></div>
              <div><span className="text-muted-foreground">Email</span><div className="font-medium">{app.email}</div></div>
              <div><span className="text-muted-foreground">DOB</span><div className="font-medium">{new Date(app.dob).toLocaleDateString("en-IN")}</div></div>
              <div><span className="text-muted-foreground">Phone</span><div className="font-medium">{app.phone}</div></div>
              <div className="md:col-span-2"><span className="text-muted-foreground">Address</span><div className="font-medium">{app.address} {app.city? `, ${app.city}`:""} — {app.state}, {app.country} {app.pincode||""}</div></div>
              <div><span className="text-muted-foreground">Identity</span><div className="font-medium">{app.identityType} — {app.identityNumber}</div></div>
              <div><span className="text-muted-foreground">Status</span><div><Badge variant="warning">{app.status}</Badge></div></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileCheck className="h-4 w-4"/> Questions & Answers (Step 2)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {app.answers?.length===0 ? <div className="text-sm text-muted-foreground py-6 text-center">No answers — questions were empty at submission time</div> : app.answers.map((a:any)=>(
                <div key={a.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <div className="text-sm font-medium">{a.question?.question}</div>
                  {a.question?.helpText && <div className="text-xs text-muted-foreground">{a.question.helpText}</div>}
                  <div className="mt-2 p-2 rounded-lg bg-white dark:bg-slate-900 text-sm border">{a.answer}</div>
                  <div className="text-xs text-muted-foreground mt-1">Type: {a.question?.type} {a.question?.isRequired?"• Required":""}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
