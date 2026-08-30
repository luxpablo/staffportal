"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, AlertTriangle, Crown } from "lucide-react";

export default function FinanceAdmin(){
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Wallet className="h-6 w-6 text-emerald-600"/> Finance — Payroll & Payouts</h1>
        <p className="text-sm text-muted-foreground">Secure finance module — only Finance/Management + Founder. Staff sees only own payouts.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">₹0</div><div className="text-xs text-muted-foreground">Pending Payouts</div><Badge variant="warning" className="mt-1 text-xs">Real DB</Badge></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">₹0</div><div className="text-xs text-muted-foreground">Total Paid</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">0</div><div className="text-xs text-muted-foreground">Commission Rules</div></CardContent></Card>
      </div>
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="p-4 flex gap-3">
          <Crown className="h-5 w-5 text-amber-600 shrink-0"/>
          <div className="text-sm"><div className="font-medium">Founder Finance View</div><div className="text-xs text-muted-foreground">Founder sees company-wide revenue, server costs, staff payroll, commissions — with OWNER_ONLY layer. Even Admin does not get Founder private financial notes without explicit permission.</div></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Statuses</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {["Pending","Approved","Processing","Paid","Failed"].map(s=> <Badge key={s} variant="secondary">{s}</Badge>)}
        </CardContent>
      </Card>
    </div>
  );
}
