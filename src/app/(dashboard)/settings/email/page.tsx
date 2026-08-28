"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mail, Lock, Send, AlertCircle, CheckCircle, Settings, Eye, EyeOff } from "lucide-react";

export default function EmailSettingsPage(){
  const [cfg,setCfg]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({ host:"", port:"587", username:"", password:"", encryption:"STARTTLS", fromName:"Zyphron Cloud", fromEmail:"no-reply@zyphron.cloud", replyTo:"" });
  const [showPass,setShowPass]=useState(false);
  const [testEmail,setTestEmail]=useState("");
  const [testState,setTestState]=useState<{loading:boolean, msg:string, ok:boolean|null}>({loading:false,msg:"",ok:null});
  const [queue,setQueue]=useState<any>(null);
  const [notifSettings,setNotifSettings]=useState<any[]>([]);

  const load=()=>{
    fetch("/api/settings/email").then(r=>r.json()).then(d=>{
      if(d.data){
        setCfg(d.data);
        setForm({
          host:d.data.host||"", port:String(d.data.port||"587"), username:d.data.username||"", password:"", // never fill masked
          encryption:d.data.encryption||"STARTTLS", fromName:d.data.fromName||"Zyphron Cloud", fromEmail:d.data.fromEmail||"", replyTo:d.data.replyTo||""
        });
      }
    }).finally(()=> setLoading(false));
    fetch("/api/email-queue").then(r=>r.json()).then(d=> setQueue(d)).catch(()=>{});
    fetch("/api/settings/notifications").then(r=>r.json()).then(d=> setNotifSettings(d.data||[])).catch(()=>{});
  };
  useEffect(()=>{ load(); },[]);

  async function save(e:React.FormEvent){
    e.preventDefault(); setSaving(true);
    try{
      const payload:any={ ...form, port: parseInt(form.port) };
      // don't send empty password if user didn't change
      if(!payload.password) delete payload.password;
      const res=await fetch("/api/settings/email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const j=await res.json();
      if(!res.ok) throw new Error(j.error);
      alert("SMTP settings saved securely — password encrypted with AES-256-GCM");
      load();
    }catch(err:any){ alert(err.message); } finally{ setSaving(false); }
  }

  async function sendTest(){
    if(!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) return alert("Enter a valid recipient email");
    setTestState({loading:true,msg:"Sending...",ok:null});
    try{
      const res=await fetch("/api/settings/email/test",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ recipient:testEmail })});
      const j=await res.json();
      if(!res.ok) throw new Error(j.error || j.details || "Failed");
      setTestState({loading:false,msg:j.message||"Successfully sent! Check inbox (and spam).",ok:true});
    }catch(err:any){
      setTestState({loading:false,msg:err.message,ok:false});
    }
  }

  async function toggleNotif(eventKey:string, field:string, value:boolean){
    await fetch("/api/settings/notifications",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({ eventKey, [field]:value })});
    load();
  }

  if(loading) return <div className="h-64 skeleton"/>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Mail className="h-6 w-6 text-primary"/> SMTP Email System</h1>
        <p className="text-sm text-muted-foreground">Real SMTP delivery via Nodemailer • AES-256-GCM encrypted credentials • Never exposed to frontend • Queue with retry</p>
      </div>

      {cfg?.source==="env" && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5"/>
            <div className="text-sm"><span className="font-medium">Using environment variables</span> — SMTP config loaded from <code>.env</code>. Save here to store securely in the database (encrypted) and override env.</div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings className="h-4 w-4"/> SMTP Configuration</CardTitle>
            <CardDescription>Admin-only • Password is encrypted and never returned to the frontend</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label>SMTP Host *</Label><Input value={form.host} onChange={e=> setForm({...form,host:e.target.value})} required placeholder="smtp.gmail.com or smtp.hostinger.com"/></div>
                <div className="space-y-1"><Label>SMTP Port *</Label><Input type="number" value={form.port} onChange={e=> setForm({...form,port:e.target.value})} required placeholder="587"/></div>
                <div className="space-y-1"><Label>SMTP Username</Label><Input value={form.username} onChange={e=> setForm({...form,username:e.target.value})} placeholder="your@email.com"/></div>
                <div className="space-y-1">
                  <Label className="flex items-center gap-2"><Lock className="h-3 w-3"/> SMTP Password {cfg?.hasPassword && <span className="text-xs font-normal text-muted-foreground">(leave blank to keep existing)</span>}</Label>
                  <div className="relative">
                    <Input type={showPass?"text":"password"} value={form.password} onChange={e=> setForm({...form,password:e.target.value})} placeholder={cfg?.hasPassword?"•••••••• (encrypted)":"your_password"} />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-7 w-7" onClick={()=> setShowPass(!showPass)}>{showPass? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}</Button>
                  </div>
                </div>
                <div className="space-y-1"><Label>Encryption *</Label>
                  <select value={form.encryption} onChange={e=> setForm({...form,encryption:e.target.value})} className="w-full h-9 rounded-xl border bg-background px-3 text-sm">
                    <option value="None">None (port 25)</option>
                    <option value="STARTTLS">STARTTLS (port 587)</option>
                    <option value="SSL">SSL (port 465)</option>
                  </select>
                </div>
                <div className="space-y-1"><Label>From Name *</Label><Input value={form.fromName} onChange={e=> setForm({...form,fromName:e.target.value})} required placeholder="Zyphron Cloud"/></div>
                <div className="space-y-1"><Label>From Email *</Label><Input type="email" value={form.fromEmail} onChange={e=> setForm({...form,fromEmail:e.target.value})} required placeholder="no-reply@zyphron.cloud"/></div>
                <div className="space-y-1"><Label>Reply-To Email</Label><Input type="email" value={form.replyTo} onChange={e=> setForm({...form,replyTo:e.target.value})} placeholder="support@zyphron.cloud"/></div>
              </div>

              {cfg?.updatedAt && <div className="text-xs text-muted-foreground">Last updated: {new Date(cfg.updatedAt).toLocaleString("en-IN")} • Source: {cfg.source}</div>}

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving?"Saving...":"Save SMTP Settings"}</Button>
                <Button type="button" variant="outline" onClick={load}>Refresh</Button>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-xs space-y-1">
                <div className="font-medium">.env example</div>
                <code className="block bg-white dark:bg-slate-900 p-2 rounded text-[11px] break-all">
                  SMTP_HOST=smtp.example.com<br/>SMTP_PORT=587<br/>SMTP_USER=your@email.com<br/>SMTP_PASSWORD=your_password<br/>SMTP_SECURE=false<br/>SMTP_FROM_NAME=Zyphron Cloud<br/>SMTP_FROM_EMAIL=no-reply@zyphron.cloud<br/>SMTP_REPLY_TO=support@zyphron.cloud
                </code>
                <div className="text-muted-foreground">Never commit real credentials to Git. Use env in production; DB storage is encrypted at rest with AUTH_SECRET.</div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Send className="h-4 w-4"/> Send Test Email</CardTitle><CardDescription>Actually connects to SMTP and sends a real email</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1"><Label>Recipient</Label><Input type="email" value={testEmail} onChange={e=> setTestEmail(e.target.value)} placeholder="you@example.com"/></div>
              <Button onClick={sendTest} disabled={testState.loading} className="w-full gap-2">{testState.loading? "Sending...": <><Send className="h-4 w-4"/> Send Test Email</>}</Button>
              {testState.msg && (
                <div className={`p-3 rounded-xl text-sm flex gap-2 ${testState.ok? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200":"bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200"}`}>
                  {testState.ok? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5"/> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5"/>}
                  <span>{testState.msg}</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground">Shows: Sending… • Successfully sent • Connection failed • Authentication failed • Invalid config • Timeout</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Queue Status</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {queue ? (
                <>
                  <div className="flex justify-between"><span>Pending</span><Badge variant="warning">{queue.pending}</Badge></div>
                  <div className="flex justify-between"><span>Sent</span><Badge variant="success">{queue.sent}</Badge></div>
                  <div className="flex justify-between"><span>Failed</span><Badge variant={queue.failed>0?"destructive":"secondary"}>{queue.failed}</Badge></div>
                  <Button size="sm" variant="outline" className="w-full mt-2" onClick={()=> fetch("/api/email-queue",{method:"POST"}).then(()=> load())}>Process Queue Now</Button>
                  <a href="/email-logs" className="block text-center text-xs text-primary hover:underline mt-2">View Email Logs →</a>
                </>
              ) : <div className="text-xs text-muted-foreground">Loading...</div>}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Notification Settings — Email ON/OFF per event</CardTitle><CardDescription>Control which events trigger emails. Staff can also set personal preferences.</CardDescription></CardHeader>
        <CardContent>
          {notifSettings.length===0 ? <div className="text-sm text-muted-foreground py-4">Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground"><tr><th className="text-left p-2">Event</th><th className="text-center p-2">Email</th><th className="text-center p-2">In-App</th><th className="text-center p-2">Enabled</th></tr></thead>
                <tbody className="divide-y">
                  {notifSettings.map((n:any)=>(
                    <tr key={n.eventKey}>
                      <td className="p-2"><div className="font-medium">{n.label}</div><div className="text-xs text-muted-foreground">{n.description}</div><div className="text-xs font-mono text-muted-foreground">{n.eventKey}</div></td>
                      <td className="p-2 text-center"><input type="checkbox" checked={n.channelEmail} onChange={e=> toggleNotif(n.eventKey,"channelEmail",e.target.checked)} className="h-4 w-4"/></td>
                      <td className="p-2 text-center"><input type="checkbox" checked={n.channelInApp} onChange={e=> toggleNotif(n.eventKey,"channelInApp",e.target.checked)} className="h-4 w-4"/></td>
                      <td className="p-2 text-center"><input type="checkbox" checked={n.isEnabled} onChange={e=> toggleNotif(n.eventKey,"isEnabled",e.target.checked)} className="h-4 w-4"/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        Security: Password is AES-256-GCM encrypted, never returned to frontend, never logged, never committed. Errors are sanitized to hide credentials.
      </div>
    </div>
  );
}
