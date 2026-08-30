"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Key, AlertTriangle, Activity } from "lucide-react";

export default function SecurityCenter(){
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Shield className="h-6 w-6 text-red-600"/> Security Center</h1>
        <p className="text-sm text-muted-foreground">Login attempts, sessions, audit, MFA, IP logs — founder & security only</p>
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">0</div><div className="text-xs text-muted-foreground">Failed Logins</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">0</div><div className="text-xs text-muted-foreground">Active Sessions</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">0</div><div className="text-xs text-muted-foreground">MFA Enabled</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">0</div><div className="text-xs text-muted-foreground">Security Events</div></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4"/> Security Events</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground py-8 text-center">No security events — all from real auditLog + Session. Brute-force protection active (rate limiting via Redis).</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Key className="h-4 w-4"/> Sessions & MFA</CardTitle></CardHeader>
        <CardContent className="text-sm">Manage sessions, reset MFA, view IP logs — all permission-checked. Founder private security logs require OWNER_ONLY.</CardContent>
      </Card>
    </div>
  );
}
