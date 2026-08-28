"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AttendancePage(){
  const [data,setData]=useState<any[]>([]);
  const [clockedIn,setClockedIn]=useState(false);
  const load=()=> fetch("/api/attendance").then(r=>r.json()).then(d=> setData(d.data||[]));
  useEffect(()=>{ load(); },[]);
  async function clock(action:string){
    const staffRes=await fetch("/api/staff").then(r=>r.json());
    const staff=staffRes.data?.[0];
    if(!staff?.id){ alert("No staff found in database — create a staff member first"); return; }
    const userId=staff.id;
    const res=await fetch("/api/attendance",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,action})});
    const j=await res.json();
    if(!res.ok){ alert(j.error||"Failed"); return; }
    setClockedIn(action==="clockIn");
    load();
  }
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Attendance</h1><p className="text-sm text-muted-foreground">Server-side timestamps • Clock in/out with breaks</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Today</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-mono font-bold">{new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={()=> clock("clockIn")} disabled={clockedIn}>Clock In</Button>
              <Button variant="outline" onClick={()=> clock("breakStart")}>Start Break</Button>
              <Button variant="outline" onClick={()=> clock("breakEnd")}>End Break</Button>
              <Button variant="secondary" onClick={()=> clock("clockOut")}>Clock Out</Button>
            </div>
            <p className="text-xs text-muted-foreground">Server time is used, not browser time. Timezone: IST</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">This Week</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.map((a:any)=> <div key={a.id} className="flex justify-between text-sm p-2 rounded-xl bg-slate-50 dark:bg-slate-800"><span>{a.user?.name} • {new Date(a.date).toLocaleDateString("en-IN")}</span><span>{a.workingHours? `${a.workingHours.toFixed(1)}h`: "—" } • {a.status}</span></div>)}
            {data.length===0 && <div className="text-sm text-muted-foreground py-6 text-center">No records</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
