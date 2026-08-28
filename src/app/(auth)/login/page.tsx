"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage(){
  const [email,setEmail]=useState("admin@zyphron.cloud");
  const [password,setPassword]=useState("Admin@123");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const router=useRouter();
  async function onSubmit(e:React.FormEvent){
    e.preventDefault(); setLoading(true); setError("");
    try{
      const res=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Login failed");
      router.push("/"); router.refresh();
    }catch(err:any){ setError(err.message);} finally{ setLoading(false); }
  }
  return (
    <div className="min-h-screen flex">
      <div className="flex-1 hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)]" />
        <div className="relative">
          <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-white text-slate-900 flex items-center justify-center font-bold">ZC</div><span className="font-semibold">Zyphron Cloud</span></div>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Staff Operations Portal</h1>
          <p className="mt-4 text-slate-300">Manage staff, tasks, payouts, tickets and performance — all in one premium workspace. Built for scale.</p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl bg-white/10 backdrop-blur p-4"><div className="text-2xl font-bold">500+</div><div className="text-xs opacity-70">Staff Managed</div></div>
            <div className="rounded-xl bg-white/10 backdrop-blur p-4"><div className="text-2xl font-bold">10k+</div><div className="text-xs opacity-70">Tasks Done</div></div>
            <div className="rounded-xl bg-white/10 backdrop-blur p-4"><div className="text-2xl font-bold">99.9%</div><div className="text-xs opacity-70">Uptime</div></div>
          </div>
        </div>
        <div className="relative text-xs opacity-50">© 2026 Zyphron Cloud — zyphron.cloud</div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your staff portal account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="admin@zyphron.cloud" /></div>
              <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
              {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">{error}</div>}
              <Button type="submit" className="w-full h-11 text-sm font-medium" disabled={loading}>{loading?"Signing in...":"Sign in"}</Button>
              <div className="text-xs text-center text-muted-foreground">Seed super admin: admin@zyphron.cloud / Admin@123 — created via <code className="bg-muted px-1 rounded">npx prisma db seed</code> (not auto-created in production)</div>
              <div className="flex justify-between text-xs"><a href="#" className="text-primary hover:underline">Forgot password?</a><a href="#" className="text-muted-foreground">Need help?</a></div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
