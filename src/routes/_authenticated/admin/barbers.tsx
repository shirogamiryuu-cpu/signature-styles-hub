import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { deleteImageByUrl } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/ImageUploader";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/barbers")({ component: BarbersAdmin });

type Barber = { id?: string; name: string; bio: string; profile_image_url: string | null; specialties: string[]; years_of_experience: number; is_active: boolean };

const blank: Barber = { name: "", bio: "", profile_image_url: null, specialties: [], years_of_experience: 0, is_active: true };

function BarbersAdmin() {
  const qc = useQueryClient();
  const { data: rows } = useQuery({
    queryKey: ["admin-barbers"],
    queryFn: async () => (await supabase.from("barbers").select("*").order("name")).data ?? [],
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Barber>(blank);
  const [specInput, setSpecInput] = useState("");

  const edit = (b: any) => { setForm({ ...b, specialties: b.specialties ?? [] }); setOpen(true); };
  const create = () => { setForm(blank); setOpen(true); };

  const save = async () => {
    const payload = { ...form, specialties: form.specialties ?? [] };
    const { error } = form.id
      ? await supabase.from("barbers").update(payload).eq("id", form.id)
      : await supabase.from("barbers").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-barbers"] });
    qc.invalidateQueries({ queryKey: ["barbers", "active"] });
  };

  const remove = async (b: any) => {
    if (!confirm(`Delete ${b.name}?`)) return;
    await deleteImageByUrl("barber-images", b.profile_image_url);
    const { error } = await supabase.from("barbers").delete().eq("id", b.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-barbers"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl">Barbers</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={create} className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4 mr-1" />Add barber</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{form.id ? "Edit" : "Add"} barber</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <ImageUploader bucket="barber-images" value={form.profile_image_url} onChange={(url) => setForm({ ...form, profile_image_url: url })} label="Profile photo" />
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Bio</Label><Textarea value={form.bio ?? ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} /></div>
              <div><Label>Years of experience</Label><Input type="number" value={form.years_of_experience} onChange={(e) => setForm({ ...form, years_of_experience: Number(e.target.value) })} /></div>
              <div>
                <Label>Specialties</Label>
                <div className="mt-1 flex gap-2"><Input value={specInput} onChange={(e) => setSpecInput(e.target.value)} placeholder="e.g. Fade" />
                  <Button type="button" variant="outline" onClick={() => { if (specInput) { setForm({ ...form, specialties: [...form.specialties, specInput] }); setSpecInput(""); } }}>Add</Button></div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {form.specialties.map((s, i) => <span key={i} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{s} <button onClick={() => setForm({ ...form, specialties: form.specialties.filter((_, j) => j !== i) })}>×</button></span>)}
                </div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Active (visible on public site)</Label></div>
              <Button onClick={save} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows?.map((b: any) => (
          <Card key={b.id}><CardContent className="p-4">
            <div className="flex gap-3">
              {b.profile_image_url ? <img src={b.profile_image_url} className="h-16 w-16 rounded object-cover" alt="" /> : <div className="h-16 w-16 rounded bg-muted" />}
              <div className="flex-1">
                <p className="font-display text-lg">{b.name}</p>
                <p className="text-xs text-muted-foreground">{b.years_of_experience}+ years {b.is_active ? "" : "· hidden"}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => edit(b)}><Pencil className="h-3 w-3" /></Button>
              <Button size="sm" variant="ghost" onClick={() => remove(b)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
