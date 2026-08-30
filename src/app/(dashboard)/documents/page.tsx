"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Search, Clock, User } from "lucide-react";

export default function DocumentsPage(){
  const [docs,setDocs]=useState<any[]>([]);
  const [search,setSearch]=useState("");
  const load=()=> fetch(`/api/documents?search=${encodeURIComponent(search)}`).then(r=>r.json()).then(d=> setDocs(d.data||[]));
  useEffect(()=>{ load(); },[search]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><FileText className="h-6 w-6 text-indigo-600"/> Documents</h1>
          <p className="text-sm text-muted-foreground">Versioned, permission-aware, wiki-ready • Real DB + StorageProvider</p>
        </div>
        <Link href="/wiki"><Button className="gap-2"><Plus className="h-4 w-4"/> New Wiki Page</Button></Link>
      </div>
      <Card><CardContent className="p-3 flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input placeholder="Search documents, wiki, guides..." className="pl-9" value={search} onChange={e=> setSearch(e.target.value)}/></div><Button variant="outline" onClick={load}>Search</Button></CardContent></Card>
      <div className="grid gap-3">
        {docs.length===0 ? <Card><CardContent className="py-12 text-center"><FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3"/><div className="font-medium">No documents yet</div><div className="text-sm text-muted-foreground">Create SOPs, policies, project docs — versioned and permission-aware.</div></CardContent></Card> : docs.map((d:any)=>(
          <Card key={d.id} className="card-hover">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center"><FileText className="h-5 w-5 text-indigo-600"/></div>
                <div className="flex-1 min-w-0">
                  <Link href={`/documents/${d.id}`} className="font-medium hover:text-primary">{d.title}</Link>
                  <div className="text-xs text-muted-foreground truncate">{d.description||"No description"} • {d.documentType} • {d.visibility}</div>
                  <div className="flex gap-2 mt-2 flex-wrap"><Badge variant="secondary" className="text-[10px]">{d.status}</Badge><Badge variant="outline" className="text-[10px]">v{d._count?.versions||1}</Badge><span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3"/>{new Date(d.updatedAt).toLocaleDateString("en-IN")}</span><span className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3"/>{d.owner?.name}</span></div>
                </div>
                <Badge variant="outline" className="text-[10px]">{d.slug}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
