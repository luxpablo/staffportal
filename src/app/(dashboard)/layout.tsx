"use client";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  useEffect(()=>{ fetch("/api/dashboard").catch(()=>{}); },[]);
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar mobileOpen={mobileOpen} onClose={()=> setMobileOpen(false)} />
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={()=> setMobileOpen(false)} />}
      <div className="lg:pl-[280px] flex flex-col min-h-screen">
        <Header onMenu={()=> setMobileOpen(true)} user={user} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
        <footer className="border-t bg-white dark:bg-slate-900 px-6 py-3 text-xs text-muted-foreground flex justify-between">
          <span>© 2026 Zyphron Cloud — zyphron.cloud</span>
          <span className="hidden sm:inline">Staff Portal v1.0 • PostgreSQL • Production Ready</span>
        </footer>
      </div>
    </div>
  );
}
