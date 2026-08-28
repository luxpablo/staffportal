"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
export default function EarningsPage(){
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  useEffect(()=>{
    fetch("/api/earnings").then(r=> r.json()).then(d=>{
      if(d.error) setError(d.error);
      else setData(d);
    }).catch(e=> setError(e.message)).finally(()=> setLoading(false));
  },[]);
  if(loading) return <div className="space-y-4"><div className="h-24 skeleton"/><div className="h-64 skeleton"/></div>;
  if(error) return <Card><CardContent className="p-8 text-center text-sm text-red-600">Failed to load earnings: {error}</CardContent></Card>;
  const tx = data?.transactions||[];
  const summary = data?.summary||{total:0, pending:0, paid:0, thisMonth:0};
  const fmt = (n:number)=> `₹${Number(n).toLocaleString("en-IN")}`;
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Earnings</h1><p className="text-sm text-muted-foreground">Immutable transaction ledger • Every change is recorded from the database</p></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{fmt(summary.total)}</div><div className="text-xs text-muted-foreground">Total Earnings</div></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{fmt(summary.pending)}</div><div className="text-xs text-muted-foreground">Pending</div></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{fmt(summary.paid)}</div><div className="text-xs text-muted-foreground">Paid</div></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><div className="text-2xl font-bold">{fmt(summary.thisMonth)}</div><div className="text-xs text-muted-foreground">This Month</div></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Transaction Ledger</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {tx.length===0 ? (
            <div className="py-12 text-center">
              <div className="text-sm font-medium">No transactions yet</div>
              <div className="text-xs text-muted-foreground mt-1">Earnings will appear here when tasks are completed and payouts are created.</div>
            </div>
          ) : tx.map((t:any)=>(
            <div key={t.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${t.type==="CREDIT"?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700"}`}>{t.type==="CREDIT"?"+":"−"}</div>
                <div><div className="text-sm font-medium">{t.category} <span className={t.type==="CREDIT"?"text-emerald-600":"text-red-600"}>{t.type==="CREDIT"?`+₹${t.amount}`:`-₹${Math.abs(t.amount)}`}</span></div><div className="text-xs text-muted-foreground">{t.description} • {new Date(t.createdAt).toLocaleDateString("en-IN")}</div></div>
              </div>
              <Badge variant="outline">{t.type}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
