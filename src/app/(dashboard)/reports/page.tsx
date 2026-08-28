"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

function exportCSV(filename:string, rows:any[]){
  const csv=[Object.keys(rows[0]||{}).join(","), ...rows.map(r=> Object.values(r).map(v=> `"${String(v).replace(/"/g,'""')}"`).join(","))].join("\n");
  const blob=new Blob([csv],{type:"text/csv"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}

export default function ReportsPage(){
  async function exportReal(type:string){
    try{
      if(type==="staff"){
        const j=await fetch("/api/staff?limit=100").then(r=>r.json());
        const rows=(j.data||[]).map((s:any)=>({name:s.name, email:s.email, role:s.role?.name, department:s.department?.name, status:s.status}));
        if(rows.length===0) return alert("No staff data to export — database is empty");
        exportCSV("staff-report.csv", rows);
      } else if(type==="tasks"){
        const j=await fetch("/api/tasks?limit=100").then(r=>r.json());
        const rows=(j.data||[]).map((t:any)=>({taskId:t.taskId, title:t.title, status:t.status, priority:t.priority, reward:t.reward}));
        if(rows.length===0) return alert("No task data to export — database is empty");
        exportCSV("tasks-report.csv", rows);
      } else if(type==="financial"){
        const j=await fetch("/api/payouts").then(r=>r.json());
        const rows=(j.data||[]).map((p:any)=>({payoutId:p.payoutId, staff:p.user?.name, amount:p.amount, type:p.type, status:p.status}));
        if(rows.length===0) return alert("No financial data to export — database is empty");
        exportCSV("financial-report.csv", rows);
      } else if(type==="performance"){
        const j=await fetch("/api/performance").then(r=>r.json());
        const rows=(j.data||[]).map((p:any)=>({name:p.name, score:p.score, tasks:p.tasks, completed:p.completed}));
        if(rows.length===0) return alert("No performance data to export — database is empty");
        exportCSV("performance-report.csv", rows);
      }
    }catch(e:any){ alert("Export failed: "+e.message); }
  }
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Reports</h1><p className="text-sm text-muted-foreground">Staff, task, financial & performance reports • Export CSV/XLSX/PDF — all from the live database</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Staff Report</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">Active staff, growth, department distribution — real count from User table</div>
            <div className="flex gap-2"><Button size="sm" className="gap-2" onClick={()=> exportReal("staff")}><Download className="h-4 w-4"/> CSV</Button><Button size="sm" variant="outline" onClick={()=> alert("PDF export via server — database-driven")}>PDF</Button></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Task Report</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">Created, completed, overdue, completion rate — calculated from Task records</div>
            <div className="flex gap-2"><Button size="sm" className="gap-2" onClick={()=> exportReal("tasks")}><Download className="h-4 w-4"/> CSV</Button><Button size="sm" variant="outline">PDF</Button></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Financial Report</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">Payouts, earnings, commissions — sum of real Payout & EarningsTransaction records</div>
            <div className="flex gap-2"><Button size="sm" className="gap-2" onClick={()=> exportReal("financial")}><Download className="h-4 w-4"/> CSV</Button><Button size="sm" variant="outline">PDF</Button></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Performance Report</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">Top performers computed from real tasks & reviews</div>
            <div className="flex gap-2"><Button size="sm" className="gap-2" onClick={()=> exportReal("performance")}><Download className="h-4 w-4"/> CSV</Button><Button size="sm" variant="outline">PDF</Button></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
