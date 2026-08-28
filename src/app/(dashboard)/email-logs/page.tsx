"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, Play } from "lucide-react";

export default function EmailLogsPage(){
  const [logs,setLogs]=useState<any[]>([]);
  const [total,setTotal]=useState(0);
  const [status,setStatus]=useState("");
  const [search,setSearch]=useState("");
  const [page,setPage]=useState(1);
  const [loading,setLoading]=useState(true);
  const limit=20;

  const load=()=>{
    setLoading(true);
    const params=new URLSearchParams({ page:String(page), limit:String(limit), ...(status?{status}:{}), ...(search?{search}:{}) });
    fetch(`/api/email-logs?${params}`).then(r=>r.json()).then(d=>{
      setLogs(d.data||[]); setTotal(d.total||0);
    }).finally(()=> setLoading(false));
  };
  useEffect(()=>{ load(); },[page,status]);
  // debounce search
  useEffect(()=>{ const id=setTimeout(()=>{ setPage(1); load(); },500); return ()=> clearTimeout(id); },[search]);

  async function retry(id?:string, retryAll=false){
    await fetch("/api/email-logs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(retryAll?{retryAll:true}:{id})});
    load();
  }

  const pages = Math.ceil(total/limit)||1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Email Logs</h1>
          <p className="text-sm text-muted-foreground">{total} emails • Pending/Processing/Sent/Failed • Never shows SMTP passwords</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-2"><RefreshCw className="h-4 w-4"/> Refresh</Button>
          <Button size="sm" onClick={()=> retry(undefined,true)} className="gap-2"><Play className="h-4 w-4"/> Retry All Failed</Button>
          <Button size="sm" variant="secondary" onClick={()=> fetch("/api/email-queue",{method:"POST"}).then(()=> load())}>Process Queue</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            <Input placeholder="Search recipient, subject, template..." className="pl-9" value={search} onChange={e=> setSearch(e.target.value)}/>
          </div>
          <select value={status} onChange={e=> { setStatus(e.target.value); setPage(1); }} className="h-9 rounded-xl border bg-background px-3 text-sm">
            <option value="">All statuses</option><option value="Pending">Pending</option><option value="Processing">Processing</option><option value="Sent">Sent</option><option value="Failed">Failed</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Queue</CardTitle>
          <span className="text-xs text-muted-foreground">Page {page} / {pages} • {total} total</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left p-3">Time</th><th className="text-left p-3">Recipient</th><th className="text-left p-3">Subject</th><th className="text-left p-3">Template</th><th className="text-left p-3">Status</th><th className="text-left p-3">Attempts</th><th className="text-right p-3">Action</th></tr>
              </thead>
              <tbody className="divide-y">
                {loading ? <tr><td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">Loading...</td></tr> :
                 logs.length===0 ? <tr><td colSpan={7} className="p-12 text-center"><div className="text-sm font-medium">No emails yet</div><div className="text-xs text-muted-foreground mt-1">Emails appear here when staff/tasks/payouts/announcements trigger — queue is empty until SMTP is configured and events occur.</div></td></tr> :
                 logs.map((l:any)=>(
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="p-3 text-xs whitespace-nowrap">{new Date(l.createdAt).toLocaleString("en-IN")}<div className="text-[11px] text-muted-foreground">{l.sentAt? `Sent ${new Date(l.sentAt).toLocaleString("en-IN")}`: l.failedAt? `Failed ${new Date(l.failedAt).toLocaleTimeString("en-IN")}`:""}</div></td>
                    <td className="p-3 text-xs">{l.recipient}</td>
                    <td className="p-3 text-xs max-w-[220px] truncate">{l.subject}</td>
                    <td className="p-3 text-xs font-mono">{l.templateKey||"—"}</td>
                    <td className="p-3"><Badge variant={l.status==="Sent"?"success": l.status==="Failed"?"destructive": l.status==="Pending"?"warning":"secondary"}>{l.status}</Badge>{l.error && <div className="text-[11px] text-red-600 max-w-[200px] truncate mt-1" title={l.error}>{l.error.slice(0,120)}</div>}</td>
                    <td className="p-3 text-xs text-center">{l.attemptCount}</td>
                    <td className="p-3 text-right">{l.status==="Failed" && <Button size="sm" variant="outline" onClick={()=> retry(l.id)}>Retry</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages>1 && (
            <div className="p-3 flex justify-between items-center border-t">
              <Button size="sm" variant="outline" disabled={page<=1} onClick={()=> setPage(p=>p-1)}>Prev</Button>
              <span className="text-xs text-muted-foreground">Page {page} of {pages}</span>
              <Button size="sm" variant="outline" disabled={page>=pages} onClick={()=> setPage(p=>p+1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">Security: SMTP passwords never appear in logs, API responses, or audit logs. All sends are via real Nodemailer transport with 10s timeout and 3 retries for transient failures.</p>
    </div>
  );
}
