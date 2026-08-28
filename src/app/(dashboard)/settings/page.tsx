"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function SettingsPage(){
  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="text-2xl font-semibold">Admin Settings</h1><p className="text-sm text-muted-foreground">Control entire platform from UI — no source edits needed</p></div>
      <Card>
        <CardHeader><CardTitle className="text-base">General</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1"><Label>Company Name</Label><Input defaultValue="Zyphron Cloud"/></div>
          <div className="space-y-1"><Label>Website</Label><Input defaultValue="https://zyphron.cloud"/></div>
          <div className="space-y-1"><Label>Timezone</Label><select className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option>Asia/Kolkata</option><option>UTC</option></select></div>
          <div className="space-y-1"><Label>Currency</Label><select className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option>INR</option><option>USD</option></select></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Roles & Permissions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            {["SUPER_ADMIN","ADMIN","HR_MANAGER","MANAGER","TEAM_LEAD","STAFF","FINANCE"].map(r=> <div key={r} className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 text-center font-medium text-xs">{r}</div>)}
          </div>
          <p className="text-xs text-muted-foreground">Permissions are independent from roles. Create custom roles via API: POST /api/roles</p>
          <Button size="sm">Manage Permissions</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Security</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1"><Label>Session Timeout (minutes)</Label><Input type="number" defaultValue="60"/></div>
          <div className="space-y-1"><Label>Password Policy</Label><select className="w-full h-9 rounded-xl border bg-background px-3 text-sm"><option>Min 8 chars, 1 uppercase, 1 number</option></select></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked/> Enable 2FA</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked/> Rate limiting</label>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Backup</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm"><span>Last backup</span><span className="text-muted-foreground">2026-08-27 02:00 IST</span></div>
          <div className="flex justify-between text-sm"><span>Frequency</span><span>Daily</span></div>
          <div className="flex justify-between text-sm"><span>Retention</span><span>30 days</span></div>
          <Button size="sm" variant="outline">Backup Now</Button>
        </CardContent>
      </Card>
      <Button>Save Settings</Button>
    </div>
  );
}
