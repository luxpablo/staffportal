"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function StaffProfilePage(){
  const { id } = useParams();
  const [staff,setStaff]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [tasks,setTasks]=useState<any[]>([]);
  useEffect(()=>{
    fetch(`/api/staff`).then(r=>r.json()).then(j=>{
      if(j.error) setError(j.error);
      else {
        const found=(j.data||[]).find((s:any)=> s.id===id);
        if(!found) setError("Staff member not found");
        else setStaff(found);
      }
    }).catch(e=> setError(e.message)).finally(()=> setLoading(false));
    fetch(`/api/tasks?limit=20`).then(r=>r.json()).then(d=> setTasks((d.data||[]).filter((t:any)=> t.assignments?.some((a:any)=> a.user?.id===id || a.userId===id)).slice(0,5)));
  },[id]);
  if(loading) return <div className="h-64 skeleton"/>;
  if(error) return <Card><CardContent className="py-12 text-center"><div className="text-sm font-medium text-red-600">{error}</div><div className="text-xs text-muted-foreground mt-2">The staff profile will appear here when the record exists in the database.</div><Button variant="outline" className="mt-4" onClick={()=> window.location.href="/staff"}>Back to Staff</Button></CardContent></Card>;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><a href="/staff" className="hover:text-foreground">Staff</a><span>/</span><span className="text-foreground font-medium">{staff.name}</span></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-6 text-center">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 mx-auto flex items-center justify-center text-white text-3xl font-bold">{staff.name?.[0]}</div>
            <div className="mt-4 font-semibold text-lg">{staff.name}</div>
            <div className="text-sm text-muted-foreground">@{staff.username} • {staff.employeeId}</div>
            <Badge className="mt-3" variant={staff.status==="Active"?"success":"secondary"}>{staff.status}</Badge>
            <div className="mt-6 space-y-2 text-sm text-left">
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium truncate ml-2">{staff.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Discord</span><span>{staff.discordUsername||"—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span>{staff.role?.name||"—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span>{staff.department?.name||"—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Joined</span><span>{staff.joinDate? new Date(staff.joinDate).toLocaleDateString("en-IN"): "—"}</span></div>
            </div>
            <Button className="w-full mt-6" variant="outline">Edit Profile</Button>
          </CardContent>
        </Card>
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Tasks</CardTitle></CardHeader>
            <CardContent>
              {tasks.length===0 ? <div className="py-8 text-center text-sm text-muted-foreground">No tasks assigned to this staff member yet</div> : (
                <div className="space-y-2">
                  {tasks.map((t:any)=> <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border"><div><div className="text-sm font-medium">{t.title}</div><div className="text-xs text-muted-foreground">{t.taskId}</div></div><Badge variant={t.status==="Completed"?"success":"secondary"}>{t.status}</Badge></div>)}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Documents</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="py-6 text-center text-sm text-muted-foreground">No documents yet. Authorized admins can upload NDA, contracts, ID and certificates — stored securely, not publicly accessible.</div>
              <Button variant="outline" className="w-full mt-2">Upload Document</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
