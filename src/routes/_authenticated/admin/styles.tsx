import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { deleteImageByUrl } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploader } from "@/components/ImageUploader";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/styles")({ component: StylesAdmin });

type Style = { id?: string; name: string; description: string; duration_minutes: number; price: number; style_image_url: string | null; is_active: boolean };
const blank: Style = { name: "", description: "", duration_minutes: 30, price: 0, style_image_url: null, is_active: true };

function StylesAdmin() {
  const qc = useQueryClient();
  const { data: rows } = useQuery({ queryKey: ["admin-styles"], queryFn: async () => (await supabase.from("haircut_styles").select("*").order("name")).data ?? [] });
  const { data: barbers } = useQuery({ queryKey: ["admin-barbers-list"], queryFn: async () => (await supabase.from("barbers").select("id,name").order("name")).data ?? [] });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Style>(blank);
  const [selectedBarbers, setSelectedBarbers] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      if (form.id) {
        const { data } = await supabase.from("barber_style_map").select("barber_id").eq("style_id", form.id);
        setSelectedBarbers((data ?? []).map((r) => r.barber_id));
      } else setSelectedBarbers([]);
    })();
  }, [form.id]);

  const edit = (s: any) => { setForm(s); setOpen(true); };
  const create = () => { setForm(blank); setOpen(true); };

  const save = async () => {
    let id = form.id;
    if (id) {
      const { error } = await supabase.from("haircut_styles").update(form).eq("id", id);
      if (error) return toast.error(error.message);
    } else {
      const { data, error } = await supabase.from("haircut_styles").insert(form).select("id").single();
      if (error) return toast.error(error.message);
      id = data!.id;
    }
    await supabase.from("barber_style_map").delete().eq("style_id", id!);
    if (selectedBarbers.length > 0) {
      await supabase.from("barber_style_map").insert(selectedBarbers.map((bid) => ({ barber_id: bid, style_id: id! })));
    }
    toast.success("Saved");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-styles"] });
    qc.invalidateQueries({ queryKey: ["styles", "active"] });
  };

  const remove = async (s: any) => {
    if (!confirm(`Delete ${s.name}?`)) return;
    await deleteImageByUrl("style-images", s.style_image_url);
    const { error } = await supabase.from("haircut_styles").delete().eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-styles"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl">Hairstyles</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={create} className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4 mr-1"/>Add style</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{form.id ? "Edit" : "Add"} style</DialogTitle></DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <ImageUploader bucket="style-images" value={form.style_image_url} onChange={(url) => setForm({ ...form, style_image_url: url })} label="Sample photo" />
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Duration (min)</Label><Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} /></div>
                <div><Label>Price (MMK)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>
              <div>
                <Label>Barbers who can do this style</Label>
                <div className="mt-2 space-y-1 rounded border p-2">
                  {barbers?.map((b) => (
                    <label key={b.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={selectedBarbers.includes(b.id)} onCheckedChange={(v) => setSelectedBarbers(v ? [...selectedBarbers, b.id] : selectedBarbers.filter((x) => x !== b.id))} />
                      {b.name}
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={save} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows?.map((s: any) => (
          <Card key={s.id}><CardContent className="p-0 overflow-hidden">
            <div className="aspect-video bg-muted">{s.style_image_url ? <img src={s.style_image_url} className="h-full w-full object-cover" alt="" /> : null}</div>
            <div className="p-4">
              <p className="font-display text-lg">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.duration_minutes} min · {Number(s.price).toLocaleString()} MMK {s.is_active ? "" : "· hidden"}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => edit(s)}><Pencil className="h-3 w-3" /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(s)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
