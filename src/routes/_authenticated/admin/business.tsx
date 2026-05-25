import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/business")({ component: BusinessAdmin });

function BusinessAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-business"], queryFn: async () => (await supabase.from("business_info").select("*").maybeSingle()).data });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = async () => {
    const payload = { ...form, updated_at: new Date().toISOString() };
    const { error } = form.id
      ? await supabase.from("business_info").update(payload).eq("id", form.id)
      : await supabase.from("business_info").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["business_info"] });
    qc.invalidateQueries({ queryKey: ["admin-business"] });
  };

  return (
    <div>
      <h1 className="font-display text-4xl">Business Info</h1>
      <Card className="mt-6 max-w-2xl"><CardContent className="p-6 space-y-4">
        <div><Label>Address</Label><Textarea value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Phone 1</Label><Input value={form.phone1 ?? ""} onChange={(e) => setForm({ ...form, phone1: e.target.value })} /></div>
          <div><Label>Phone 2</Label><Input value={form.phone2 ?? ""} onChange={(e) => setForm({ ...form, phone2: e.target.value })} /></div>
          <div><Label>Phone 3</Label><Input value={form.phone3 ?? ""} onChange={(e) => setForm({ ...form, phone3: e.target.value })} /></div>
        </div>
        <div><Label>Opening hours</Label><Input value={form.opening_hours_text ?? ""} onChange={(e) => setForm({ ...form, opening_hours_text: e.target.value })} /></div>
        <div><Label>Facebook URL</Label><Input value={form.facebook_url ?? ""} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} /></div>
        <div><Label>Google Maps embed URL</Label><Input value={form.google_maps_embed_link ?? ""} onChange={(e) => setForm({ ...form, google_maps_embed_link: e.target.value })} /></div>
        <Button onClick={save} className="bg-accent text-accent-foreground hover:bg-accent/90">Save</Button>
      </CardContent></Card>
    </div>
  );
}
