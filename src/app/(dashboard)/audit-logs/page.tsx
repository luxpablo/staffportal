"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AuditLogsPage(){
  const [logs,setLogs]=useState<any[]>([]);
  useEffect(()=>{ fetch("/api/audit-logs").then(r=>r.json()).then(d=> setLogs(d.data||[])); },[]);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Audit Logs</h1><p className="text-sm text-muted-foreground">Append-only • IP + user agent + old/new values</p></div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left p-3">Time</th><th className="text-left p-3">User</th><th className="text-left p-3">Action</th><th className="text-left p-3">Entity</th><th className="text-left p-3">IP</th></tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((l:any)=>(
                  <tr key={l.id}>
                    <td className="p-3 text-xs">{new Date(l.createdAt).toLocaleString("en-IN")}</td>
                    <td className="p-3">{l.user?.name||"System"}</td>
                    <td className="p-3"><Badge variant="outline">{l.action}</Badge></td>
                    <td className="p-3 text-xs">{l.entity} {l.entityId? `• ${l.entityId}`:""}</td>
                    <td className="p-3 text-xs">{l.ip||"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Button variant="outline" onClick={()=> {
        const rows=logs.map(l=>({time:l.createdAt,user:l.user?.name,action:l.action,entity:l.entity,ip:l.ip}));
        const csv=[Object.keys(rows[0]||{}).join(","),...rows.map(r=>Object.values(r).join(","))].join("\n");
        const blob=new Blob([csv],{type:"text/csv"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="audit-logs.csv"; a.click();
      }}>Export CSV</Button>
    </div>
  );
}
