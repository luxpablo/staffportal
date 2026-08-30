"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, Plus, Clock, Star, FileText } from "lucide-react";

export default function WikiPage(){
  const [docs,setDocs]=useState<any[]>([]);
  const [search,setSearch]=useState("");
  const load=()=> fetch(`/api/documents?search=${encodeURIComponent(search)}`).then(r=>r.json()).then(d=> setDocs(d.data||[]));
  useEffect(()=>{ load(); },[search]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><BookOpen className="h-6 w-6 text-indigo-600"/> Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">Wiki — SOPs, hosting procedures, policies, dev docs • Versioned, permission-aware</p>
        </div>
        <Link href="/documents"><Button className="gap-2"><Plus className="h-4 w-4"/> New Document</Button></Link>
      </div>
      <Card>
        <CardContent className="p-3 flex gap-2">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input placeholder="Search wiki pages, docs, guides..." className="pl-9" value={search} onChange={e=> setSearch(e.target.value)}/></div>
          <Button variant="outline" onClick={load}>Search</Button>
        </CardContent>
      </Card>
      <div className="grid lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="py-3"><CardTitle className="text-sm">Categories</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {["Getting Started","Company","Policies","Departments","Hosting","Infrastructure","Development","Support","Troubleshooting","FAQs"].map(c=>(
              <div key={c} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"><BookOpen className="h-4 w-4 text-muted-foreground"/>{c}</div>
            ))}
          </CardContent>
        </Card>
        <div className="lg:col-span-3 space-y-3">
          {docs.length===0 ? <Card><CardContent className="py-12 text-center"><BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3"/><div className="font-medium">No wiki pages yet</div><div className="text-sm text-muted-foreground">Create SOPs, guides, policies — real versioned documents.</div></CardContent></Card> : docs.map((d:any)=>(
            <Card key={d.id} className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/wiki/${d.slug}`} className="font-medium hover:text-primary">{d.title}</Link>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{d.description||"No description"}</div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px]">{d.documentType}</Badge>
                      <Badge variant="outline" className="text-[10px]">{d.visibility}</Badge>
                      <Badge variant={d.status==="PUBLISHED"?"success":"secondary"} className="text-[10px]">{d.status}</Badge>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right shrink-0">
                    <div className="flex items-center gap-1"><Clock className="h-3 w-3"/>{new Date(d.updatedAt).toLocaleDateString("en-IN")}</div>
                    <div>{d.owner?.name}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Card className="border-dashed">
            <CardContent className="p-4 flex gap-2">
              <Button size="sm" variant="outline" className="gap-2"><FileText className="h-4 w-4"/> SOP Template</Button>
              <Button size="sm" variant="outline">Project Doc</Button>
              <Button size="sm" variant="outline">Meeting Notes</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
