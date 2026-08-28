"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Megaphone } from "lucide-react";

export default function AnnouncementsPage(){
  const [data,setData]=useState<any[]>([]);
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({title:"",content:"",priority:"General"});
  const load=()=> fetch("/api/announcements").then(r=>r.json()).then(d=> setData(d.data||[]));
  useEffect(()=>{ load(); },[]);
  async function create(e:React.FormEvent){
    e.preventDefault();
    const res=await fetch("/api/announcements",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    if(!res.ok){ const j=await res.json(); alert(j.error); return; }
    setShowAdd(false); setForm({title:"",content:"",priority:"General"}); load();
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-semibold">Announcements</h1><p className="text-sm text-muted-foreground">Targeted by department/role • Discord + email notifications</p></div><Button onClick={()=> setShowAdd(true)} className="gap-2"><Plus className="h-4 w-4"/> New Announcement</Button></div>
      <div className="grid gap-4">
        {data.map((a:any)=>(
          <Card key={a.id} className={a.priority==="Emergency"?"border-red-200 dark:border-red-900":""}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0"><Megaphone className="h-4 w-4"/></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2"><span className="font-medium">{a.title}</span><Badge variant={a.priority==="Emergency"?"destructive": a.priority==="Important"?"warning":"secondary"}>{a.priority}</Badge></div>
                  <div className="text-sm text-muted-foreground mt-1">{a.content}</div>
                  <div className="text-xs text-muted-foreground mt-2">{new Date(a.createdAt||a.publishDate).toLocaleString("en-IN")}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={()=> setShowAdd(false)}>
          <form onSubmit={create} onClick={e=> e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xl">
            <h3 className="font-semibold">Publish Announcement</h3>
            <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={e=> setForm({...form,title:e.target.value})} required placeholder="New commission structure"/></div>
            <div className="space-y-1"><Label>Content</Label><Textarea value={form.content} onChange={e=> setForm({...form,content:e.target.value})} required rows={4} placeholder="Detailed announcement..."/></div>
            <div className="space-y-1"><Label>Priority</Label><select value={form.priority} onChange={e=> setForm({...form,priority:e.target.value})} className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option>General</option><option>Important</option><option>Emergency</option><option>HR</option><option>Technical</option><option>Maintenance</option></select></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=> setShowAdd(false)}>Cancel</Button><Button type="submit">Publish</Button></div>
          </form>
        </div>
      )}
    </div>
  );
}
