import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/appointments")({ component: AppointmentsAdmin });

const statuses = ["pending", "confirmed", "completed", "cancelled"] as const;

function AppointmentsAdmin() {
  const qc = useQueryClient();
  const { data: rows } = useQuery({
    queryKey: ["admin-appts"],
    queryFn: async () => (await supabase.from("appointments").select("*, barbers(name), haircut_styles(name)").order("appointment_datetime", { ascending: false })).data ?? [],
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["admin-appts"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this appointment?")) return;
    const alsoDeleteRegister = confirm("Also delete the linked haircut register entry (if any)?");
    if (alsoDeleteRegister) await supabase.from("haircut_registers").delete().eq("appointment_id", id);
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-appts"] });
  };

  return (
    <div>
      <h1 className="font-display text-4xl">Appointments</h1>
      <div className="mt-6 rounded-md border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr><th className="p-3">When</th><th className="p-3">Customer</th><th className="p-3">Phone</th><th className="p-3">Style</th><th className="p-3">Barber</th><th className="p-3">Status</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {rows?.map((a: any) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="p-3 whitespace-nowrap">{new Date(a.appointment_datetime).toLocaleString()}</td>
                <td className="p-3">{a.customer_name}</td>
                <td className="p-3">{a.customer_phone}</td>
                <td className="p-3">{a.haircut_styles?.name ?? "—"}</td>
                <td className="p-3">{a.barbers?.name ?? "—"}</td>
                <td className="p-3">
                  <Select value={a.status} onValueChange={(v) => updateStatus(a.id, v)}>
                    <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="p-3"><Button size="sm" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button></td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No appointments yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Marking an appointment "completed" automatically adds an entry to the haircut register.</p>
    </div>
  );
}
