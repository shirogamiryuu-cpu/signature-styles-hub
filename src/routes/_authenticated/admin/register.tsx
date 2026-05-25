import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/register")({ component: RegisterAdmin });

function RegisterAdmin() {
  const qc = useQueryClient();
  const { data: barbers } = useQuery({ queryKey: ["admin-barbers-list"], queryFn: async () => (await supabase.from("barbers").select("id,name").order("name")).data ?? [] });
  const [barberId, setBarberId] = useState<string>("");
  const { data: styles } = useQuery({
    queryKey: ["barber-styles-options", barberId],
    enabled: !!barberId,
    queryFn: async () => {
      const { data } = await supabase.from("barber_style_map").select("style_id, haircut_styles!inner(id,name,price)").eq("barber_id", barberId);
      return (data ?? []).map((r: any) => r.haircut_styles);
    },
  });
  const [styleId, setStyleId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");

  const { data: rows } = useQuery({
    queryKey: ["admin-registers"],
    queryFn: async () => (await supabase.from("haircut_registers").select("*, barbers(name), haircut_styles(name)").order("date_performed", { ascending: false }).limit(100)).data ?? [],
  });

  const save = async () => {
    if (!barberId || !styleId) return toast.error("Barber and style are required");
    const { error } = await supabase.from("haircut_registers").insert({
      barber_id: barberId, style_id: styleId,
      customer_name: customerName || null, customer_phone: customerPhone || null,
      price_charged: price ? Number(price) : null, notes: notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Entry added");
    setStyleId(""); setCustomerName(""); setCustomerPhone(""); setPrice(""); setNotes("");
    qc.invalidateQueries({ queryKey: ["admin-registers"] });
  };

  return (
    <div>
      <h1 className="font-display text-4xl">Haircut Register</h1>

      <Card className="mt-6"><CardContent className="p-6 grid gap-3 md:grid-cols-2">
        <div>
          <Label>Barber *</Label>
          <Select value={barberId} onValueChange={(v) => { setBarberId(v); setStyleId(""); }}>
            <SelectTrigger><SelectValue placeholder="Select barber" /></SelectTrigger>
            <SelectContent>{barbers?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Style *</Label>
          <Select value={styleId} onValueChange={setStyleId} disabled={!barberId}>
            <SelectTrigger><SelectValue placeholder={barberId ? "Select style" : "Choose barber first"} /></SelectTrigger>
            <SelectContent>{styles?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Customer name</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
        <div><Label>Customer phone</Label><Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} /></div>
        <div><Label>Price charged (MMK)</Label><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
        <div><Label>Notes</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        <div className="md:col-span-2"><Button onClick={save} className="bg-accent text-accent-foreground hover:bg-accent/90">Add entry</Button></div>
      </CardContent></Card>

      <h2 className="mt-10 font-display text-2xl">Recent entries</h2>
      <div className="mt-3 rounded-md border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground"><tr><th className="p-3">Date</th><th className="p-3">Barber</th><th className="p-3">Style</th><th className="p-3">Customer</th><th className="p-3">Price</th></tr></thead>
          <tbody>
            {rows?.map((r: any) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="p-3">{new Date(r.date_performed).toLocaleDateString()}</td>
                <td className="p-3">{r.barbers?.name ?? "—"}</td>
                <td className="p-3">{r.haircut_styles?.name ?? "—"}</td>
                <td className="p-3">{r.customer_name ?? "—"}</td>
                <td className="p-3">{r.price_charged ? Number(r.price_charged).toLocaleString() + " MMK" : "—"}</td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No entries yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
