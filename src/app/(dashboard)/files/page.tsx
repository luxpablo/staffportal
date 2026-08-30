"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Folder, FileText, Upload, Search, Grid, List, Download, Trash2, Star, Share2 } from "lucide-react";

export default function FilesPage(){
  const [files,setFiles]=useState<any[]>([]);
  const [folders,setFolders]=useState<any[]>([]);
  const [view,setView]=useState<"grid"|"list">("grid");
  const [search,setSearch]=useState("");
  const [uploading,setUploading]=useState(false);
  const load=()=>{
    fetch(`/api/files?search=${encodeURIComponent(search)}`).then(r=>r.json()).then(d=> setFiles(d.data||[]));
    fetch("/api/folders").then(r=>r.json()).then(d=> setFolders(d.data||[]));
  };
  useEffect(()=>{ load(); },[search]);
  const onUpload=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];
    if(!file) return;
    setUploading(true);
    const fd=new FormData();
    fd.append("file", file);
    const res=await fetch("/api/files",{method:"POST", body: fd});
    const j=await res.json();
    setUploading(false);
    if(!res.ok) return alert(j.error);
    load();
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Folder className="h-6 w-6 text-blue-600"/> Files</h1>
          <p className="text-sm text-muted-foreground">Private storage • Signed URLs • Real S3/Local via StorageProvider</p>
        </div>
        <div className="flex gap-2">
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium cursor-pointer hover:bg-blue-700">
            <Upload className="h-4 w-4"/>{uploading?"Uploading...":"Upload"}
            <input type="file" className="hidden" onChange={onUpload} />
          </label>
        </div>
      </div>
      <Card>
        <CardContent className="p-3 flex gap-2">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input placeholder="Search files, folders..." className="pl-9" value={search} onChange={e=> setSearch(e.target.value)}/></div>
          <Button variant={view==="grid"?"secondary":"ghost"} size="icon" onClick={()=> setView("grid")}><Grid className="h-4 w-4"/></Button>
          <Button variant={view==="list"?"secondary":"ghost"} size="icon" onClick={()=> setView("list")}><List className="h-4 w-4"/></Button>
        </CardContent>
      </Card>
      <div className="text-xs text-muted-foreground">Folders</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {folders.length===0 ? <div className="col-span-full text-sm text-muted-foreground py-4 text-center border-2 border-dashed rounded-xl">No folders — create one via API /api/folders</div> : folders.map((f:any)=>(
          <Card key={f.id} className="card-hover"><CardContent className="p-4 flex items-center gap-3"><Folder className="h-6 w-6 text-amber-500"/><div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{f.name}</div><div className="text-xs text-muted-foreground">{f._count?.files||0} files</div></div></CardContent></Card>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">Files — private, signed URLs via GET /api/files/:id/download (auth-checked)</div>
      {files.length===0 ? <Card><CardContent className="py-12 text-center"><FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3"/><div className="font-medium">No files yet</div><div className="text-sm text-muted-foreground">Upload via drag & drop or picker — real storage, not mock.</div></CardContent></Card> : (
        <div className={view==="grid"?"grid md:grid-cols-3 lg:grid-cols-4 gap-3":"space-y-2"}>
          {files.map((f:any)=>(
            <Card key={f.id} className="card-hover group">
              <CardContent className={view==="grid" ? "p-4" : "p-3 flex items-center gap-3"}>
                {view==="grid" ? (
                  <>
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><FileText className="h-5 w-5 text-slate-600"/></div>
                    <div className="mt-3 min-w-0"><div className="text-sm font-medium truncate">{f.name}</div><div className="text-xs text-muted-foreground truncate">{f.originalName} • {(f.size/1024).toFixed(1)}kB</div><Badge variant="secondary" className="mt-1 text-[10px]">{f.visibility}</Badge></div>
                    <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={async()=>{
                        const res=await fetch(`/api/files/${f.id}/download`);
                        if(!res.ok) return alert("Download denied: "+await res.text());
                        const blob=await res.blob();
                        const url=URL.createObjectURL(blob);
                        const a=document.createElement("a"); a.href=url; a.download=f.originalName; a.click();
                      }}><Download className="h-3 w-3"/> Download</Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8"><Star className="h-4 w-4"/></Button>
                    </div>
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0"/>
                    <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{f.originalName}</div><div className="text-xs text-muted-foreground">{f.mimeType} • {(f.size/1024).toFixed(1)}kB • {new Date(f.createdAt).toLocaleDateString("en-IN")}</div></div>
                    <Badge variant="secondary" className="text-[10px]">{f.visibility}</Badge>
                    <Button size="sm" variant="ghost" onClick={async()=>{
                      const res=await fetch(`/api/files/${f.id}/download`);
                      if(!res.ok) return alert("Download denied");
                      const blob=await res.blob();
                      const url=URL.createObjectURL(blob);
                      const a=document.createElement("a"); a.href=url; a.download=f.originalName; a.click();
                    }}><Download className="h-4 w-4"/></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8"><Trash2 className="h-4 w-4"/></Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
