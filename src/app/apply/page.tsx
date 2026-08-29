"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Upload, CheckCircle, User, MapPin, FileCheck, HelpCircle, Calendar, Phone, Mail, Shield } from "lucide-react";

type Question = { id:string; question:string; helpText?:string; type:string; options:string[]; isRequired:boolean; sortOrder:number };

export default function ApplyPage(){
  const [step,setStep]=useState(1);
  const [questions,setQuestions]=useState<Question[]>([]);
  const [loadingQuestions,setLoadingQuestions]=useState(true);
  const [submitting,setSubmitting]=useState(false);
  const [success,setSuccess]=useState<any>(null);
  const [error,setError]=useState("");

  // Step 1 fields
  const [form,setForm]=useState({
    name:"", email:"", dob:"", phone:"", address:"", city:"", state:"", country:"", pincode:"",
    identityType:"Aadhaar", identityNumber:"", identityProofUrl:"", identityProofName:"", photoUrl:"", photoName:""
  });
  const [uploading,setUploading]=useState({ identity:false, photo:false });
  const [answers,setAnswers]=useState<Record<string,string>>({});

  useEffect(()=>{
    fetch("/api/application-questions").then(r=>r.json()).then(d=> setQuestions(d.data||[])).finally(()=> setLoadingQuestions(false));
  },[]);

  async function handleFile(e:React.ChangeEvent<HTMLInputElement>, type:"identity"|"photo"){
    const file=e.target.files?.[0];
    if(!file) return;
    setError("");
    const key = type==="photo" ? "photo" : "identity";
    setUploading(prev=> ({...prev, [key]:true}));
    try{
      const fd=new FormData();
      fd.append("file", file);
      fd.append("type", type);
      const res=await fetch("/api/upload",{method:"POST",body:fd});
      const j=await res.json();
      if(!res.ok) throw new Error(j.error);
      if(type==="photo"){
        setForm(f=> ({...f, photoUrl:j.url, photoName: j.name}));
      } else {
        setForm(f=> ({...f, identityProofUrl:j.url, identityProofName: j.name}));
      }
    }catch(err:any){ setError(err.message); } finally{ setUploading(prev=> ({...prev, [key]:false})); }
  }

  function validateStep1(){
    if(!form.name.trim()) return "Name is required";
    if(!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Valid email is required";
    if(!form.dob) return "Date of birth is required";
    const age=(Date.now()-new Date(form.dob).getTime())/(365.25*24*3600000);
    if(age<16) return "Must be at least 16 years old";
    if(!form.phone.trim()) return "Phone number is required";
    if(!/^\+?[0-9\s\-()]{7,20}$/.test(form.phone)) return "Invalid phone number";
    if(!form.address.trim()) return "Address is required";
    if(!form.state.trim()) return "State is required";
    if(!form.country.trim()) return "Country is required";
    if(!form.identityType) return "Identity proof type is required";
    if(!form.identityNumber.trim()) return "Identity number is required";
    if(!form.identityProofUrl) return "Identity proof file is required — please upload";
    if(!form.photoUrl) return "Photo is required — please upload";
    return null;
  }

  function nextStep(){
    const err=validateStep1();
    if(err){ setError(err); return; }
    setError("");
    setStep(2);
    window.scrollTo({top:0, behavior:"smooth"});
  }

  async function submit(){
    setError("");
    // validate questions
    for(const q of questions){
      if(q.isRequired && !String(answers[q.id]||"").trim()){
        setError(`Please answer: ${q.question}`);
        return;
      }
    }
    setSubmitting(true);
    try{
      const payload={
        ...form,
        answers: Object.entries(answers).map(([questionId, answer])=> ({questionId, answer}))
      };
      const res=await fetch("/api/applications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const j=await res.json();
      if(!res.ok) throw new Error(j.error);
      setSuccess(j.data);
    }catch(err:any){ setError(err.message); } finally{ setSubmitting(false); }
  }

  if(success){
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex flex-col">
        <header className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur sticky top-0">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">ZC</div><span className="font-semibold text-sm">Zyphron Cloud</span></Link>
            <Link href="/"><Button variant="ghost" size="sm">Back to Home</Button></Link>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg text-center">
            <CardContent className="pt-8 pb-8">
              <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto"><CheckCircle className="h-8 w-8 text-emerald-600"/></div>
              <h1 className="text-2xl font-bold mt-4">Application Submitted!</h1>
              <p className="text-sm text-muted-foreground mt-2">Your application <span className="font-mono font-medium text-foreground">{success.applicationId}</span> has been received. We’ll review it and contact you at <strong>{form.email}</strong>.</p>
              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-left">
                <div><strong>Name:</strong> {form.name}</div>
                <div><strong>Email:</strong> {form.email}</div>
                <div><strong>Status:</strong> <Badge variant="warning">Pending Review</Badge></div>
              </div>
              <div className="mt-6 flex gap-2 justify-center">
                <Link href="/"><Button variant="outline">Go to Homepage</Button></Link>
                <Link href="/apply"><Button onClick={()=> {setSuccess(null); setStep(1); setForm({ name:"", email:"", dob:"", phone:"", address:"", city:"", state:"", country:"", pincode:"", identityType:"Aadhaar", identityNumber:"", identityProofUrl:"", identityProofName:"", photoUrl:"", photoName:""}); setAnswers({});}}>Submit Another</Button></Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/60 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white"><div className="h-8 w-8 rounded-lg bg-white text-slate-900 flex items-center justify-center font-bold text-xs">ZC</div><span className="font-semibold text-sm">Zyphron Cloud</span><span className="hidden sm:inline text-xs text-slate-400 ml-2">• Staff Application</span></Link>
          <div className="flex gap-2">
            <Link href="/"><Button variant="ghost" size="sm" className="text-white hover:bg-white/10">Home</Button></Link>
            <Link href="/login"><Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100">Login</Button></Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center text-white mb-8">
          <Badge className="bg-blue-600 text-white border-0 gap-1.5 mb-3">Join Zyphron Cloud</Badge>
          <h1 className="text-3xl font-bold tracking-tight">Staff Application</h1>
          <p className="text-slate-300 text-sm mt-2">2 steps — Personal details (with verification) then questions. All data is stored securely in PostgreSQL.</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step===1?"bg-white text-slate-900":"bg-white/10 text-white"}`}><User className="h-4 w-4"/> 1. Personal Details</div>
          <div className="h-px w-8 bg-white/20"/>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step===2?"bg-white text-slate-900":"bg-white/10 text-white"}`}><HelpCircle className="h-4 w-4"/> 2. Questions</div>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">{error}</div>}

        {step===1 ? (
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-blue-600"/> Personal Details</CardTitle>
              <CardDescription>Step 1 — Name, DOB, phone, address, state, country, identity proof and photo are all required.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Full Name *</Label><Input value={form.name} onChange={e=> setForm({...form,name:e.target.value})} placeholder="Aarav Sharma" /></div>
                <div className="space-y-1"><Label>Date of Birth *</Label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input type="date" value={form.dob} onChange={e=> setForm({...form,dob:e.target.value})} className="pl-9" /></div></div>
                <div className="space-y-1"><Label>Phone Number *</Label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input value={form.phone} onChange={e=> setForm({...form,phone:e.target.value})} placeholder="+91 98765 43210" className="pl-9" /></div></div>
                <div className="space-y-1"><Label>Email *</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input type="email" value={form.email} onChange={e=> setForm({...form,email:e.target.value})} placeholder="you@example.com" className="pl-9" /></div></div>
                <div className="md:col-span-2 space-y-1"><Label>Address (Street) *</Label><div className="relative"><MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Textarea value={form.address} onChange={e=> setForm({...form,address:e.target.value})} placeholder="House no, street, locality" className="pl-9" rows={2} /></div></div>
                <div className="space-y-1"><Label>City</Label><Input value={form.city} onChange={e=> setForm({...form,city:e.target.value})} placeholder="Mumbai" /></div>
                <div className="space-y-1"><Label>Pincode</Label><Input value={form.pincode} onChange={e=> setForm({...form,pincode:e.target.value})} placeholder="400001" /></div>
                <div className="space-y-1"><Label>State *</Label><Input value={form.state} onChange={e=> setForm({...form,state:e.target.value})} placeholder="Maharashtra" /></div>
                <div className="space-y-1"><Label>Country *</Label><Input value={form.country} onChange={e=> setForm({...form,country:e.target.value})} placeholder="India" /></div>
                <div className="space-y-1"><Label>Identity Proof Type *</Label>
                  <select value={form.identityType} onChange={e=> setForm({...form,identityType:e.target.value})} className="w-full h-9 rounded-xl border bg-background px-3 text-sm">
                    <option>Aadhaar</option><option>Passport</option><option>Driving License</option><option>PAN</option><option>Voter ID</option><option>Other</option>
                  </select>
                </div>
                <div className="space-y-1"><Label>Identity Number *</Label><Input value={form.identityNumber} onChange={e=> setForm({...form,identityNumber:e.target.value})} placeholder="1234 5678 9012" /></div>
                <div className="space-y-1">
                  <Label className="flex items-center gap-2"><FileCheck className="h-4 w-4"/> Identity Proof File * <span className="text-xs font-normal text-muted-foreground">(JPG/PNG/PDF, max 5MB)</span></Label>
                  <div className="flex gap-2">
                    <Input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={e=> handleFile(e,"identity")} className="flex-1" />
                    {uploading.identity && <Badge variant="secondary">Uploading...</Badge>}
                    {form.identityProofUrl && !uploading.identity && <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3"/> Uploaded</Badge>}
                  </div>
                  {form.identityProofUrl && <div className="text-xs text-muted-foreground truncate">{form.identityProofName} → <a href={form.identityProofUrl} target="_blank" className="text-blue-600 underline">{form.identityProofUrl}</a></div>}
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center gap-2"><Shield className="h-4 w-4"/> Photo * <span className="text-xs font-normal text-muted-foreground">(JPG/PNG, max 5MB)</span></Label>
                  <div className="flex gap-2">
                    <Input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={e=> handleFile(e,"photo")} className="flex-1" />
                    {uploading.photo && <Badge variant="secondary">Uploading...</Badge>}
                    {form.photoUrl && !uploading.photo && <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3"/> Uploaded</Badge>}
                  </div>
                  {form.photoUrl && (
                    <div className="flex items-center gap-2 mt-2">
                      <img src={form.photoUrl} alt="preview" className="h-12 w-12 rounded-lg object-cover border" />
                      <span className="text-xs text-muted-foreground truncate">{form.photoName}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <Link href="/"><Button variant="ghost" className="gap-2"><ArrowLeft className="h-4 w-4"/> Back to Home</Button></Link>
                <Button onClick={nextStep} className="gap-2">Next: Questions <ArrowRight className="h-4 w-4"/></Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-blue-600"/> Questions</CardTitle>
              <CardDescription>Step 2 — Please answer all required questions honestly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingQuestions ? <div className="h-32 skeleton rounded-xl"/> : questions.length===0 ? <div className="text-sm text-muted-foreground py-8 text-center">No questions configured — you can submit directly.</div> : questions.map(q=>(
                <div key={q.id} className="space-y-1">
                  <Label>{q.question} {q.isRequired && <span className="text-red-500">*</span>}</Label>
                  {q.helpText && <div className="text-xs text-muted-foreground">{q.helpText}</div>}
                  {q.type==="text" ? (
                    <Input value={answers[q.id]||""} onChange={e=> setAnswers({...answers,[q.id]:e.target.value})} placeholder="Your answer" />
                  ) : q.type==="select" ? (
                    <select value={answers[q.id]||""} onChange={e=> setAnswers({...answers,[q.id]:e.target.value})} className="w-full h-9 rounded-xl border bg-background px-3 text-sm">
                      <option value="">Select...</option>
                      {q.options.map(o=> <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <Textarea value={answers[q.id]||""} onChange={e=> setAnswers({...answers,[q.id]:e.target.value})} rows={3} placeholder="Your answer..." />
                  )}
                </div>
              ))}
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={()=> setStep(1)} className="gap-2"><ArrowLeft className="h-4 w-4"/> Back</Button>
                <Button onClick={submit} disabled={submitting} className="gap-2">{submitting?"Submitting...":"Submit Application"} <Upload className="h-4 w-4"/></Button>
              </div>
              <div className="text-xs text-muted-foreground text-center">By submitting, you confirm all details are correct. Files are stored securely under /uploads/applications and linked to your application ID.</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
