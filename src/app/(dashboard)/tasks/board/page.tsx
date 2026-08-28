"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const columns = ["Backlog","Assigned","In Progress","Waiting","Under Review","Completed"];

export default function KanbanBoard(){
  const [tasks,setTasks]=useState<any[]>([]);
  const [dragId,setDragId]=useState<string|null>(null);
  useEffect(()=>{ fetch("/api/tasks?limit=100").then(r=>r.json()).then(d=> setTasks(d.data||[])); },[]);
  async function moveTask(taskId:string, newStatus:string){
    setTasks(prev=> prev.map(t=> t.id===taskId? {...t,status:newStatus}: t));
    try{ await fetch(`/api/tasks/${taskId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:newStatus})}); }catch{}
  }
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-semibold">Kanban Board</h1><p className="text-sm text-muted-foreground">Drag & drop to update status — changes persist to database</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {columns.map(col=>{
          const colTasks=tasks.filter(t=> t.status===col);
          const display = colTasks;
          return (
            <div key={col} className="rounded-2xl bg-slate-100 dark:bg-slate-900 p-3 min-h-[400px] flex flex-col"
              onDragOver={e=> e.preventDefault()}
              onDrop={()=> dragId && moveTask(dragId, col)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">{col}</span>
                <Badge variant="secondary" className="text-[10px]">{display.length}</Badge>
              </div>
              <div className="space-y-3 flex-1">
                {display.map((t:any)=>(
                  <Card key={t.id} draggable onDragStart={()=> setDragId(t.id)} onDragEnd={()=> setDragId(null)} className={`cursor-grab active:cursor-grabbing ${dragId===t.id?"opacity-50 ring-2 ring-primary":""}`}>
                    <CardContent className="p-3">
                      <div className="text-xs font-mono text-muted-foreground">{t.taskId}</div>
                      <div className="text-sm font-medium leading-tight mt-1 line-clamp-2">{t.title}</div>
                      <div className="flex gap-1 mt-2">
                        <Badge variant={t.priority==="Urgent"||t.priority==="High"?"destructive":"secondary"} className="text-[10px]">{t.priority}</Badge>
                        {t.reward? <span className="text-xs ml-auto">₹{t.reward}</span>: null}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">{t.assignments?.[0]?.user?.name||"Unassigned"}</div>
                    </CardContent>
                  </Card>
                ))}
                {display.length===0 && <div className="text-xs text-muted-foreground text-center py-8 border-2 border-dashed rounded-xl">No tasks</div>}
              </div>
            </div>
          );
        })}
      </div>
      {tasks.length===0 && (
        <Card><CardContent className="p-6">
          <div className="py-8 text-center">
            <div className="text-sm font-medium">No tasks yet</div>
            <div className="text-xs text-muted-foreground mt-1">Create tasks and drag them across columns — every move is saved to the database.</div>
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
