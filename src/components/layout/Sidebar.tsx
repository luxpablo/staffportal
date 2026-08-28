"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Building2, ClipboardList, Kanban, Wallet, Ticket, BarChart3, CalendarCheck, CalendarDays, Megaphone, FileText, ScrollText, Settings, Plug, Briefcase, Mail, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/departments", label: "Departments", icon: Building2 },
  { href: "/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/tasks/board", label: "Kanban Board", icon: Kanban },
  { href: "/my-work", label: "My Work", icon: Briefcase },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/payouts", label: "Payouts", icon: Wallet },
  { href: "/earnings", label: "Earnings", icon: Wallet },
  { href: "/performance", label: "Performance", icon: BarChart3 },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/leave", label: "Leave", icon: CalendarDays },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/email-logs", label: "Email Logs", icon: Mail },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/settings/email", label: "Email Settings", icon: Mail },
  { href: "/settings/email/templates", label: "Email Templates", icon: ShieldCheck },
];

export function Sidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  return (
    <aside className={cn("fixed inset-y-0 left-0 z-40 w-[280px] border-r bg-white dark:bg-slate-950 flex flex-col transition-transform lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
      <div className="h-[64px] flex items-center gap-3 px-6 border-b">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">ZC</div>
        <div>
          <div className="font-semibold text-sm leading-none">Zyphron Cloud</div>
          <div className="text-xs text-muted-foreground">Staff Portal</div>
        </div>
        <span className="ml-auto text-[10px] px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-medium">v1.0</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} onClick={onClose} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors", active ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900")}>
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 text-white">
          <div className="text-sm font-medium">Need help?</div>
          <div className="text-xs opacity-80 mt-1">Contact Super Admin or check documentation.</div>
        </div>
      </div>
    </aside>
  );
}
