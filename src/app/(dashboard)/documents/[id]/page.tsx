"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Save, Clock, User, Share2, History, Star, Download } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "next/link";

export default function DocumentPage(){
  const { id } = useParams();
  const [doc,setDoc]=useState<any>(null);
  const [saving,setSaving]=useState("Saved");
  const [versions,setVersions]=useState<any[]>([]);
  const [showHistory,setShowHistory]=useState(false);
  const [title,setTitle]=useState("");

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Loading...</p>",
    onUpdate: ({ editor })=>{
      setSaving("Saving...");
      // Debounced autosave
      const html=editor.getHTML();
      setTimeout(async()=>{
        const res=await fetch(`/api/documents/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({ content: html, title })});
        if(res.ok) setSaving("Saved");
        else setSaving("Error");
      }, 1000);
    },
  });

  const load=async()=>{
    const res=await fetch(`/api/documents/${id}`);
    if(!res.ok) return;
    const j=await res.json();
    setDoc(j.data);
    setTitle(j.data.title);
    if(editor && j.data.content) editor.commands.setContent(j.data.content);
    // Load versions
    const vres=await fetch(`/api/documents/${id}/versions`);
    if(vres.ok){
      const vj=await vres.json();
      setVersions(vj.data||[]);
    }
  };
  useEffect(()=>{ load(); },[id, editor]);

  const saveTitle=async()=>{
    const res=await fetch(`/api/documents/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({ title })});
    if(res.ok){ setSaving("Saved"); load(); }
  };

  const restoreVersion=async(verId:string)=>{
    if(!confirm("Restore this version? This will create a new version with the old content.")) return;
    const res=await fetch(`/api/documents/${id}/versions`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ restoreId: verId })});
    if(res.ok) load();
    else alert("Restore failed");
  };

  if(!doc) return <div className="h-64 skeleton rounded-2xl"/>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/documents" className="hover:text-foreground">Documents</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{doc.title}</span>
        <Badge variant="outline" className="ml-auto gap-1"><Clock className="h-3 w-3"/>{saving}</Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="flex-1">
            <Input value={title} onChange={e=> setTitle(e.target.value)} onBlur={saveTitle} className="text-lg font-semibold border-0 px-0 h-auto focus-visible:ring-0" />
            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1"><User className="h-3 w-3"/>{doc.owner?.name}</span>
              <span>•</span>
              <span>{new Date(doc.updatedAt).toLocaleString("en-IN")}</span>
              <Badge variant="secondary" className="text-[10px]">{doc.visibility}</Badge>
              <Badge variant={doc.status==="PUBLISHED"?"success":"secondary"} className="text-[10px]">{doc.status}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={()=> setShowHistory(!showHistory)} className="gap-2"><History className="h-4 w-4"/> History ({versions.length})</Button>
            <Button size="sm" variant="outline" className="gap-2"><Share2 className="h-4 w-4"/> Share</Button>
            <Button size="sm" variant="ghost"><Star className="h-4 w-4"/></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-xl p-4 min-h-[400px] bg-white dark:bg-slate-900">
            <EditorContent editor={editor} />
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={()=> editor?.chain().focus().toggleBold().run()} className={editor?.isActive("bold")?"bg-slate-900 text-white":""}>Bold</Button>
            <Button size="sm" variant="outline" onClick={()=> editor?.chain().focus().toggleBulletList().run()}>List</Button>
            <Button size="sm" variant="outline" onClick={()=> editor?.chain().focus().toggleCodeBlock().run()}>Code</Button>
            <Button size="sm" variant="outline" onClick={()=> {
              const url=prompt("Enter URL");
              if(url) editor?.chain().focus().setLink({ href: url }).run();
            }}>Link</Button>
          </div>
        </CardContent>
      </Card>

      {showHistory && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4"/> Version History</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {versions.length===0 ? <div className="text-sm text-muted-foreground py-4 text-center">No versions yet</div> : versions.map((v:any)=>(
              <div key={v.id} className="flex gap-3 p-3 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800">
                <div className="flex-1">
                  <div className="text-sm font-medium">Version {v.versionNumber} <Badge variant="outline" className="ml-2 text-[10px]">{new Date(v.createdAt).toLocaleString("en-IN")}</Badge></div>
                  <div className="text-xs text-muted-foreground">By {v.createdBy?.name||"Unknown"} • {v.changeSummary||"Update"}</div>
                  <div className="text-xs mt-1 line-clamp-2 bg-slate-50 dark:bg-slate-900 p-2 rounded">{v.content.replace(/<[^>]*>/g,"").slice(0,120)}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="sm" variant="outline" onClick={()=> restoreVersion(v.id)}>Restore</Button>
                  <Button size="sm" variant="ghost" onClick={()=> alert(v.content.slice(0,500))}>View</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground">
          <div>Document linking: Use <code className="bg-muted px-1 rounded">[[Server Deployment SOP]]</code> to link to other docs (permission-checked). Attachments via <code className="bg-muted px-1 rounded">/api/files</code> private storage.</div>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" className="gap-2"><Download className="h-4 w-4"/> Export PDF</Button>
            <Button size="sm" variant="outline">Export Markdown</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
