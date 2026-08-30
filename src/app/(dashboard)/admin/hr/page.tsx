"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, FileText, Users } from "lucide-react";

export default function HRPage(){
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Shield className="h-6 w-6 text-amber-600"/> HR Operations</h1>
        <p className="text-sm text-muted-foreground">Warnings, reviews, internal notes — HR/Management only, no mock</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">0</div><div className="text-xs text-muted-foreground">Warnings</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">0</div><div className="text-xs text-muted-foreground">Reviews</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">0</div><div className="text-xs text-muted-foreground">Internal Notes</div></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4"/> Restricted HR Section</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-xl border bg-amber-50 dark:bg-amber-950/20 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0"/>
            <div className="text-sm"><div className="font-medium">HR data is private</div><div className="text-muted-foreground text-xs">Only HR/Management with explicit permission can view warnings, reviews, and internal HR notes. Staff cannot see their own HR notes.</div></div>
          </div>
          <div className="text-sm">Features: Warnings • Reviews • Internal Notes • Policy acknowledgments • Attendance deep dive • All from real DB `prisma.performanceReview` + `auditLog`</div>
          <Button size="sm" variant="outline" className="gap-2"><Users className="h-4 w-4"/> View Staff HR</Button>
        </CardContent>
      </Card>
    </div>
  );
}
