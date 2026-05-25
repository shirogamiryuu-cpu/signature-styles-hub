import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { signOut } from "@/hooks/use-auth";
import { Scissors, LayoutDashboard, Users, Sparkles, CalendarClock, ClipboardList, MessageSquare, Building2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminLayout });

const nav: { to: string; label: string; icon: any; exact?: boolean }[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/barbers", label: "Barbers", icon: Users },
  { to: "/admin/styles", label: "Hairstyles", icon: Sparkles },
  { to: "/admin/appointments", label: "Appointments", icon: CalendarClock },
  { to: "/admin/register", label: "Haircut Register", icon: ClipboardList },
  { to: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { to: "/admin/business", label: "Business Info", icon: Building2 },
];

function AdminLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="px-5 py-5 border-b border-sidebar-border flex items-center gap-2">
          <Scissors className="h-5 w-5 text-sidebar-primary" />
          <div>
            <p className="font-display text-lg">Signature</p>
            <p className="text-xs opacity-70">Admin Console</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => {
            const active = n.exact ? path === n.to : path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent"}`}>
                <n.icon className="h-4 w-4" />{n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start hover:bg-sidebar-accent">
            <LogOut className="h-4 w-4 mr-1" />Sign out
          </Button>
          <Link to="/" className="mt-1 block px-3 py-1.5 text-xs opacity-70 hover:opacity-100">View site →</Link>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto"><div className="p-8"><Outlet /></div></main>
    </div>
  );
}
