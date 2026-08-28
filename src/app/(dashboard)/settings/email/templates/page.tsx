"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, Send, RotateCcw, Save, AlertCircle } from "lucide-react";

export default function EmailTemplatesPage(){
  const [templates,setTemplates]=useState<any[]>([]);
  const [selected,setSelected]=useState<any>(null);
  const [form,setForm]=useState({ subject:"", htmlBody:"", isEnabled:true });
  const [previewHtml,setPreviewHtml]=useState("");
  const [previewSubject,setPreviewSubject]=useState("");
  const [testRecipient,setTestRecipient]=useState("");
  const [saving,setSaving]=useState(false);

  const load=()=> fetch("/api/settings/email/templates").then(r=>r.json()).then(d=> {
    setTemplates(d.data||[]);
    if(!selected && d.data?.[0]) { setSelected(d.data[0]); setForm({ subject:d.data[0].subject, htmlBody:d.data[0].htmlBody, isEnabled:d.data[0].isEnabled }); }
  });
  useEffect(()=>{ load(); },[]);

  function select(t:any){
    setSelected(t);
    setForm({ subject:t.subject, htmlBody:t.htmlBody, isEnabled:t.isEnabled });
    setPreviewHtml(""); setPreviewSubject("");
  }

  async function save(){
    if(!selected) return;
    setSaving(true);
    try{
      const res=await fetch("/api/settings/email/templates",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({ key:selected.key, ...form })});
      const j=await res.json();
      if(!res.ok) throw new Error(j.error);
      alert("Template saved");
      load();
    }catch(e:any){ alert(e.message); } finally{ setSaving(false); }
  }

  async function preview(sendTest=false){
    if(!selected) return;
    const res=await fetch("/api/settings/email/templates",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ key:selected.key, recipient: sendTest? testRecipient : undefined })});
    const j=await res.json();
    if(!res.ok) return alert(j.error);
    if(sendTest) alert(j.message || "Test email queued");
    else { setPreviewSubject(j.preview.subject); setPreviewHtml(j.preview.html); }
  }

  async function reset(){
    if(!selected || !confirm(`Reset ${selected.key} to default?`)) return;
    const res=await fetch("/api/settings/email/templates",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({ key:selected.key, reset:true })});
    const j=await res.json();
    if(!res.ok) return alert(j.error);
    alert("Reset to default");
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Email Templates</h1>
        <p className="text-sm text-muted-foreground">Edit subject/body, enable/disable, preview with real Zyphron branding, send test, reset to default. Variables: {"{{staff_name}}, {{staff_email}}, {{task_title}}, {{task_deadline}}, {{task_reward}}, {{payout_amount}}, {{payout_status}}, {{announcement_title}}, {{company_name}}, {{login_url}}"}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader><CardTitle className="text-base">Templates ({templates.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {templates.map(t=>(
                <button key={t.key} onClick={()=> select(t)} className={`w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between ${selected?.key===t.key?"bg-slate-100 dark:bg-slate-800":""}`}>
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs font-mono text-muted-foreground">{t.key}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[180px]">{t.subject}</div>
                  </div>
                  <Badge variant={t.isEnabled?"success":"secondary"} className="ml-2 text-[10px]">{t.isEnabled?"ON":"OFF"}</Badge>
                </button>
              ))}
              {templates.length===0 && <div className="p-6 text-center text-sm text-muted-foreground">No templates — will be seeded automatically</div>}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          {!selected ? <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Select a template</CardContent></Card> : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{selected.name} <span className="text-xs font-mono font-normal text-muted-foreground ml-2">{selected.key}</span></span>
                    <Badge variant={selected.isSystem?"secondary":"outline"}>{selected.isSystem?"System":"Custom"}</Badge>
                  </CardTitle>
                  <CardDescription>Variables: <code className="text-xs bg-muted px-1 rounded">{(selected.variables||[]).join(", ")}</code></CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isEnabled} onChange={e=> setForm({...form,isEnabled:e.target.checked})} className="h-4 w-4"/> Enabled (if OFF, no emails sent for this event)</label>
                  <div className="space-y-1"><Label>Subject *</Label><Input value={form.subject} onChange={e=> setForm({...form,subject:e.target.value})} placeholder="Welcome to {{company_name}}"/></div>
                  <div className="space-y-1"><Label>HTML Body *</Label><Textarea value={form.htmlBody} onChange={e=> setForm({...form,htmlBody:e.target.value})} rows={12} className="font-mono text-xs" placeholder="<h1>Hello {{staff_name}}</h1>..."/></div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={save} disabled={saving} className="gap-2"><Save className="h-4 w-4"/>{saving?"Saving...":"Save"}</Button>
                    <Button variant="outline" onClick={()=> preview(false)} className="gap-2"><Eye className="h-4 w-4"/> Preview</Button>
                    <Button variant="outline" onClick={reset} className="gap-2"><RotateCcw className="h-4 w-4"/> Reset to Default</Button>
                  </div>
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 p-3 text-xs flex gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0"/><span>Use {"{{variable}}"} syntax. Preview renders with sample data. All emails are wrapped in Zyphron Cloud responsive branding (blue/white, logo, footer) and tested on Gmail/Outlook/Apple Mail.</span>
                  </div>
                  <div className="flex gap-2">
                    <Input type="email" value={testRecipient} onChange={e=> setTestRecipient(e.target.value)} placeholder="test@example.com for send test" className="flex-1"/>
                    <Button variant="secondary" onClick={()=> preview(true)} className="gap-2"><Send className="h-4 w-4"/> Send Test Email</Button>
                  </div>
                </CardContent>
              </Card>

              {(previewSubject || previewHtml) && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Preview</CardTitle><CardDescription>Subject: <strong>{previewSubject}</strong></CardDescription></CardHeader>
                  <CardContent>
                    <div className="border rounded-xl overflow-hidden bg-white">
                      <div className="p-2 bg-slate-100 text-xs font-mono">Subject: {previewSubject}</div>
                      <iframe srcDoc={previewHtml} className="w-full h-[500px] border-0" title="preview"/>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
