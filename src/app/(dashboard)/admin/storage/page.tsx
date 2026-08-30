"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HardDrive, FileText, Folder, ShieldAlert, AlertTriangle, Database } from "lucide-react";

export default function AdminStoragePage(){
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ fetch("/api/admin/storage").then(r=>r.json()).then(d=> setData(d.data)).finally(()=> setLoading(false)); },[]);
  if(loading) return <div className="h-64 skeleton rounded-2xl"/>;
  if(!data) return <div className="text-sm text-muted-foreground">Failed to load</div>;
  const usedGB=(data.totalSize/1024/1024/1024).toFixed(2);
  const quotaGB=10;
  const pct=Math.min(100, Math.round((data.totalSize/ (quotaGB*1024*1024*1024))*100));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2"><HardDrive className="h-6 w-6 text-blue-600"/> Storage Monitoring</h1>
        <p className="text-sm text-muted-foreground">Real DB + storage metrics • Private storage via StorageProvider (Local/S3) • Signed URLs</p>
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{data.totalFiles}</div><div className="text-xs text-muted-foreground">Total Files</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{data.totalDocs}</div><div className="text-xs text-muted-foreground">Documents</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{data.totalFolders}</div><div className="text-xs text-muted-foreground">Folders</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-amber-600">{data.quarantined}</div><div className="text-xs text-muted-foreground">Quarantined</div></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4"/> Storage Quota</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm">Provider: <Badge variant="outline">{data.storageProvider}</Badge> • Used: {usedGB} GB / {quotaGB} GB ({pct}%)</div>
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2"><div className="h-full bg-blue-600 rounded-full transition-all" style={{width:`${pct}%`}}/></div>
          <div className="text-xs text-muted-foreground mt-2">Quota enforced server-side on every upload (MAX_FILE_SIZE). Private files never exposed via /public/uploads.</div>
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Largest Files</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.largest?.length===0 ? <div className="text-sm text-muted-foreground py-4 text-center">No files</div> : data.largest?.map((f:any,i:number)=>(
              <div key={i} className="flex justify-between text-sm p-2 rounded-lg border"><span className="truncate">{f.name}</span><span>{(f.size/1024/1024).toFixed(2)} MB</span></div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Recent Uploads</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.recentUploads?.length===0 ? <div className="text-sm text-muted-foreground py-4 text-center">No uploads</div> : data.recentUploads?.map((f:any,i:number)=>(
              <div key={i} className="flex justify-between text-xs p-2 rounded-lg border"><span className="truncate">{f.name} • {f.uploadedBy?.name}</span><span>{new Date(f.createdAt).toLocaleDateString("en-IN")}</span></div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-amber-600"/> Security: Path traversal blocked, MIME spoofing checked, storageKey is uuid (not original name), private files via signed <code className="bg-muted px-1 rounded">/api/files/:id/download</code>, audit on download.</div>
        </CardContent>
      </Card>
    </div>
  );
}
