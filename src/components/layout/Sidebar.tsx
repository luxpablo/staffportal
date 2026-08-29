"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, Users, Building2, ClipboardList, Kanban, Wallet, Ticket, BarChart3, CalendarCheck, CalendarDays, Megaphone, FileText, ScrollText, Settings, Plug, Briefcase, Mail, ShieldCheck, FileCheck, Layers, Sparkles, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href:string; label:string; icon:any; badge?:string };
type NavSection = { title:string; icon:any; color:string; items: NavItem[] };

const sections: NavSection[] = [
  {
    title: "Overview",
    icon: Layers,
    color: "text-blue-600",
    items: [
      { href: "/", label: "Homepage", icon: Home },
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "People",
    icon: Users,
    color: "text-emerald-600",
    items: [
      { href: "/staff", label: "Staff", icon: Users },
      { href: "/leadership", label: "Leadership", icon: Crown, badge: "New" },
      { href: "/applications", label: "Applications", icon: FileCheck, badge: "New" },
      { href: "/apply", label: "Apply (Public)", icon: FileText },
      { href: "/departments", label: "Departments", icon: Building2 },
      { href: "/attendance", label: "Attendance", icon: CalendarCheck },
      { href: "/leave", label: "Leave", icon: CalendarDays },
      { href: "/performance", label: "Performance", icon: BarChart3 },
    ],
  },
  {
    title: "Work",
    icon: Briefcase,
    color: "text-amber-600",
    items: [
      { href: "/tasks", label: "Tasks", icon: ClipboardList },
      { href: "/tasks/board", label: "Kanban Board", icon: Kanban },
      { href: "/my-work", label: "My Work", icon: Briefcase },
      { href: "/tickets", label: "Tickets", icon: Ticket },
      { href: "/announcements", label: "Announcements", icon: Megaphone },
    ],
  },
  {
    title: "Finance",
    icon: Wallet,
    color: "text-emerald-600",
    items: [
      { href: "/payouts", label: "Payouts", icon: Wallet },
      { href: "/earnings", label: "Earnings", icon: Wallet },
    ],
  },
  {
    title: "Operations",
    icon: Settings,
    color: "text-slate-600",
    items: [
      { href: "/reports", label: "Reports", icon: FileText },
      { href: "/audit-logs", label: "Audit Logs", icon: ScrollText },
      { href: "/email-logs", label: "Email Logs", icon: Mail },
      { href: "/integrations", label: "Integrations", icon: Plug },
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/settings/email", label: "Email Settings", icon: Mail },
      { href: "/settings/email/templates", label: "Email Templates", icon: ShieldCheck },
    ],
  },
];

export function Sidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  return (
    <aside className={cn("fixed inset-y-0 left-0 z-40 w-[280px] border-r bg-white dark:bg-slate-950 flex flex-col transition-transform lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
      <div className="h-[64px] flex items-center gap-3 px-6 border-b shrink-0">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-soft">ZC</div>
        <div>
          <div className="font-semibold text-sm leading-none">Zyphron Cloud</div>
          <div className="text-xs text-muted-foreground">Staff Portal</div>
        </div>
        <span className="ml-auto text-[10px] px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-medium">v1.0</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-thin">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="flex items-center gap-2 px-2 mb-2">
              <section.icon className={`h-3.5 w-3.5 ${section.color}`} />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{section.title}</span>
              <span className="h-px flex-1 bg-border ml-2" />
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-muted-foreground font-medium">{section.items.length}</span>
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} onClick={onClose} className={cn("flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all", active ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-soft translate-x-0.5" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:translate-x-0.5")}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate flex-1">{item.label}</span>
                    {item.badge && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-medium">{item.badge}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t shrink-0 space-y-3">
        <div className="rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-4 text-white shadow-medium">
          <div className="flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4"/> Need help?</div>
          <div className="text-xs opacity-90 mt-1">Contact Super Admin or check docs.</div>
          <Link href="/settings"><span className="mt-3 inline-flex text-xs font-medium bg-white text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">Open Settings</span></Link>
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
          <span>© 2026 Zyphron</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/> Live DB</span>
        </div>
      </div>
    </aside>
  );
}
