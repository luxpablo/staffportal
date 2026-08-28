"use client";
import { useState, useEffect } from "react";
import { Bell, Search, Menu, Moon, Sun, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Header({ onMenu, user }: { onMenu: () => void; user?: any }) {
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("theme") || "light";
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    function onKey(e: KeyboardEvent) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCommandOpen(v=>!v); } }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next); localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  useEffect(() => {
    fetch("/api/notifications?limit=5").then(r=>r.json()).then(d=> setNotifications(d.data||[])).catch(()=>{});
  }, [showNotif]);

  return (
    <header className="sticky top-0 z-30 h-[64px] border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex items-center gap-3 px-4 lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu}><Menu className="h-5 w-5"/></Button>
      <div className="relative hidden md:flex items-center flex-1 max-w-md">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground"/>
        <Input placeholder="Search staff, tasks, tickets... (Ctrl+K)" className="pl-9 bg-slate-50 dark:bg-slate-900 border-0" onFocus={()=> setCommandOpen(true)} />
      </div>
      <div className="flex-1 md:hidden" />
      <Button variant="ghost" size="icon" onClick={toggleTheme}>{theme==="dark"? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}</Button>
      <div className="relative">
        <Button variant="ghost" size="icon" onClick={()=> setShowNotif(!showNotif)} className="relative">
          <Bell className="h-4 w-4"/><span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"/>
        </Button>
        {showNotif && (
          <div className="absolute right-0 mt-2 w-80 rounded-2xl border bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between"><span className="font-medium text-sm">Notifications</span><button className="text-xs text-primary">Mark all read</button></div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length===0 ? <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div> : notifications.map((n:any)=><div key={n.id} className="p-3 border-b last:border-0 hover:bg-muted/50"><div className="text-sm font-medium">{n.title}</div><div className="text-xs text-muted-foreground line-clamp-2">{n.message}</div></div>)}
            </div>
          </div>
        )}
      </div>
      <div className="h-6 w-px bg-border hidden sm:block"/>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center text-white text-sm font-medium">{user?.name?.[0]||"A"}</div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium leading-none">{user?.name||"Admin User"}</div>
          <div className="text-xs text-muted-foreground">{user?.role?.name||"SUPER_ADMIN"}</div>
        </div>
        <form action="/api/auth/logout" method="post"><Button variant="ghost" size="icon" type="submit"><LogOut className="h-4 w-4"/></Button></form>
      </div>
      {commandOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[20vh]" onClick={()=> setCommandOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border overflow-hidden" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center gap-3 p-4 border-b"><Search className="h-4 w-4 text-muted-foreground"/><input autoFocus placeholder="Type a command or search..." className="flex-1 bg-transparent outline-none text-sm"/><span className="text-xs bg-muted px-2 py-1 rounded">ESC</span></div>
            <div className="p-2 text-sm">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">Commands</div>
              {[
                ["Create task","/tasks"],
                ["Add staff","/staff"],
                ["Create payout","/payouts"],
                ["View reports","/reports"],
                ["Create announcement","/announcements"],
                ["Go to settings","/settings"],
              ].map(([label,href])=> <a key={label} href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-sm">{label}</a>)}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
