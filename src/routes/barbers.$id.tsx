import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Scissors, Clock, Tag, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/barbers/$id")({
  component: BarberDetail,
  notFoundComponent: () => <div className="p-10 text-center">Barber not found.</div>,
  errorComponent: ({ error }) => <div className="p-10 text-center">Error: {error.message}</div>,
});

function BarberDetail() {
  const { id } = useParams({ from: "/barbers/$id" });

  const { data: barber, isLoading } = useQuery({
    queryKey: ["barber", id],
    queryFn: async () => {
      const { data } = await supabase.from("barbers").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  const { data: styles } = useQuery({
    queryKey: ["barber-styles", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("barber_style_map")
        .select("style_id, haircut_styles!inner(*)")
        .eq("barber_id", id);
      return (data ?? []).map((r: any) => r.haircut_styles).filter((s: any) => s?.is_active);
    },
  });

  if (isLoading) return <div className="p-10 text-center">Loading…</div>;
  if (!barber) return <div className="p-10 text-center">Barber not found.</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="container mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="mt-6 grid gap-10 md:grid-cols-[1fr_2fr]">
          <div className="aspect-[4/5] overflow-hidden rounded-2xl border bg-muted">
            {barber.profile_image_url ? (
              <img src={barber.profile_image_url} alt={barber.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-accent/20">
                <Scissors className="h-20 w-20 text-accent/40" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm uppercase tracking-widest text-accent">{barber.years_of_experience}+ years of experience</p>
            <h1 className="mt-2 font-display text-5xl md:text-6xl">{barber.name}</h1>
            {barber.bio && <p className="mt-5 text-lg text-muted-foreground">{barber.bio}</p>}
            {barber.specialties && barber.specialties.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {barber.specialties.map((s: string) => (
                  <span key={s} className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent">{s}</span>
                ))}
              </div>
            )}
            <Button asChild size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/book" search={{ barber: barber.id } as any}>Book with {barber.name}</Link>
            </Button>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="font-display text-3xl">Styles {barber.name} performs</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {styles?.map((s: any) => (
              <Card key={s.id} className="overflow-hidden">
                <div className="aspect-video overflow-hidden bg-muted">
                  {s.style_image_url ? (
                    <img src={s.style_image_url} alt={s.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-accent/10">
                      <Scissors className="h-12 w-12 text-accent/40" />
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <h3 className="font-display text-xl">{s.name}</h3>
                  {s.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>}
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" />{s.duration_minutes} min</span>
                    <span className="flex items-center gap-1 font-medium"><Tag className="h-3.5 w-3.5" />{Number(s.price).toLocaleString()} MMK</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!styles || styles.length === 0) && (
              <p className="text-muted-foreground">No styles configured yet.</p>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
