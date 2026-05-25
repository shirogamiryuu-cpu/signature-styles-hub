import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Sparkles, CalendarClock, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Dashboard });

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [b, s, a, r, up] = await Promise.all([
        supabase.from("barbers").select("id", { count: "exact", head: true }),
        supabase.from("haircut_styles").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }).eq("is_approved", false),
        supabase.from("appointments").select("*, barbers(name), haircut_styles(name)").gte("appointment_datetime", new Date().toISOString()).order("appointment_datetime").limit(10),
      ]);
      return { barbers: b.count ?? 0, styles: s.count ?? 0, appts: a.count ?? 0, pendingReviews: r.count ?? 0, upcoming: up.data ?? [] };
    },
  });

  const cards = [
    { label: "Barbers", value: stats?.barbers ?? 0, icon: Users },
    { label: "Hairstyles", value: stats?.styles ?? 0, icon: Sparkles },
    { label: "Appointments", value: stats?.appts ?? 0, icon: CalendarClock },
    { label: "Reviews pending", value: stats?.pendingReviews ?? 0, icon: MessageSquare },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl">Dashboard</h1>
      <p className="text-muted-foreground">Overview of your salon.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <c.icon className="h-5 w-5 text-accent" />
            </div>
            <p className="mt-2 font-display text-4xl">{c.value}</p>
          </CardContent></Card>
        ))}
      </div>

      <h2 className="mt-12 font-display text-2xl">Upcoming appointments</h2>
      <div className="mt-4 rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr><th className="p-3">Date</th><th className="p-3">Customer</th><th className="p-3">Phone</th><th className="p-3">Style</th><th className="p-3">Barber</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {stats?.upcoming.map((a: any) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="p-3">{new Date(a.appointment_datetime).toLocaleString()}</td>
                <td className="p-3">{a.customer_name}</td>
                <td className="p-3">{a.customer_phone}</td>
                <td className="p-3">{a.haircut_styles?.name ?? "—"}</td>
                <td className="p-3">{a.barbers?.name ?? "—"}</td>
                <td className="p-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{a.status}</span></td>
              </tr>
            ))}
            {(!stats?.upcoming || stats.upcoming.length === 0) && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No upcoming appointments.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
