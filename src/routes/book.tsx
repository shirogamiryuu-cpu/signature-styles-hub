import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { notifyAppointment } from "@/lib/telegram.functions";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Scissors, Clock, Tag, Check, ArrowLeft } from "lucide-react";

type Search = { barber?: string; style?: string };

export const Route = createFileRoute("/book")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    barber: typeof s.barber === "string" ? s.barber : undefined,
    style: typeof s.style === "string" ? s.style : undefined,
  }),
  component: BookPage,
});

function BookPage() {
  const search = useSearch({ from: "/book" });
  const navigate = useNavigate();
  const notify = useServerFn(notifyAppointment);
  const [step, setStep] = useState<1 | 2 | 3>(search.style ? (search.barber ? 3 : 2) : 1);
  const [styleId, setStyleId] = useState<string | null>(search.style ?? null);
  const [barberId, setBarberId] = useState<string | null>(search.barber ?? null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const { data: styles } = useQuery({
    queryKey: ["styles", "active"],
    queryFn: async () => (await supabase.from("haircut_styles").select("*").eq("is_active", true).order("name")).data ?? [],
  });

  const { data: barbersForStyle } = useQuery({
    queryKey: ["barbers-for-style", styleId],
    enabled: !!styleId,
    queryFn: async () => {
      const { data } = await supabase
        .from("barber_style_map")
        .select("barber_id, barbers!inner(*)")
        .eq("style_id", styleId!);
      return (data ?? []).map((r: any) => r.barbers).filter((b: any) => b?.is_active);
    },
  });

  const style = styles?.find((s) => s.id === styleId);
  const barber = barbersForStyle?.find((b: any) => b.id === barberId);

  const submit = async () => {
    if (!styleId || !barberId || !date || !time || !name || !phone) {
      toast.error("Please complete all required fields.");
      return;
    }
    setSubmitting(true);
    const dt = new Date(`${date}T${time}:00`);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: inserted, error } = await supabase.from("appointments").insert({
      customer_name: name,
      customer_email: email || null,
      customer_phone: phone,
      appointment_datetime: dt.toISOString(),
      barber_id: barberId,
      style_id: styleId,
      status: "pending",
      notes: notes || null,
      user_id: user?.id ?? null,
    }).select("id").single();
    if (error) {
      setSubmitting(false);
      const msg = /conflicts with another appointment/i.test(error.message)
        ? "That time slot is already booked for this barber. Please pick another time."
        : error.message;
      toast.error(msg);
      return;
    }
    notify({ data: { appointmentId: inserted.id } }).catch(() => {});
    setSubmitting(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="container mx-auto flex flex-1 items-center justify-center px-4 py-20">
          <Card className="max-w-lg p-8 text-center">
            <CardContent className="p-0">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-accent"><Check className="h-7 w-7" /></div>
              <h1 className="mt-6 font-display text-3xl">Request received</h1>
              <p className="mt-3 text-muted-foreground">We'll confirm your appointment shortly by phone. Thank you for booking with Signature Hair Stylist.</p>
              <Button className="mt-6" onClick={() => navigate({ to: "/" })}>Back home</Button>
            </CardContent>
          </Card>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm uppercase tracking-widest text-accent">Book your visit</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Three simple steps.</h1>

        <div className="mt-8 flex items-center gap-2 text-sm">
          {[1,2,3].map((n) => (
            <div key={n} className={`flex-1 rounded-full px-3 py-1.5 text-center ${step>=n ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
              {n}. {n===1?"Style":n===2?"Barber":"When & who"}
            </div>
          ))}
        </div>

        {/* STEP 1: STYLE */}
        {step === 1 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {styles?.map((s) => (
              <button key={s.id} type="button" onClick={() => { setStyleId(s.id); setBarberId(null); setStep(2); }}
                className={`group text-left rounded-xl border bg-card overflow-hidden transition hover:shadow-md ${styleId===s.id?"ring-2 ring-accent":""}`}>
                <div className="aspect-video bg-muted overflow-hidden">
                  {s.style_image_url
                    ? <img src={s.style_image_url} alt={s.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                    : <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-accent/10"><Scissors className="h-12 w-12 text-accent/40" /></div>}
                </div>
                <div className="p-4">
                  <h3 className="font-display text-xl">{s.name}</h3>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" />{s.duration_minutes} min</span>
                    <span className="flex items-center gap-1 font-medium"><Tag className="h-3.5 w-3.5" />{Number(s.price).toLocaleString()} MMK</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* STEP 2: BARBER */}
        {step === 2 && (
          <div className="mt-8">
            <button onClick={() => setStep(1)} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent"><ArrowLeft className="h-4 w-4"/>Change style</button>
            <p className="mb-4 text-sm text-muted-foreground">Style: <strong className="text-foreground">{style?.name}</strong></p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {barbersForStyle?.map((b: any) => (
                <button key={b.id} type="button" onClick={() => { setBarberId(b.id); setStep(3); }}
                  className={`group text-left rounded-xl border bg-card overflow-hidden transition hover:shadow-md ${barberId===b.id?"ring-2 ring-accent":""}`}>
                  <div className="aspect-square bg-muted overflow-hidden">
                    {b.profile_image_url
                      ? <img src={b.profile_image_url} alt={b.name} className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-accent/20"><Scissors className="h-12 w-12 text-accent/40" /></div>}
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-xl">{b.name}</h3>
                    <p className="text-xs uppercase tracking-widest text-accent">{b.years_of_experience}+ years</p>
                  </div>
                </button>
              ))}
              {barbersForStyle && barbersForStyle.length === 0 && (
                <p className="text-muted-foreground">No barbers available for this style yet.</p>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: WHEN & CONTACT */}
        {step === 3 && (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-accent">Selected</p>
                  <p className="mt-1"><strong>{style?.name}</strong> with <strong>{barber?.name}</strong></p>
                  <p className="text-sm text-muted-foreground">{style?.duration_minutes} min · {Number(style?.price ?? 0).toLocaleString()} MMK</p>
                  <button onClick={() => setStep(1)} className="mt-2 text-xs text-muted-foreground underline">Change</button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().slice(0,10)} /></div>
                  <div><Label>Time</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-6">
                <div><Label>Your name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><Label>Phone *</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09…" /></div>
                <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
                <Button onClick={submit} disabled={submitting} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  {submitting ? "Submitting…" : "Confirm booking request"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
