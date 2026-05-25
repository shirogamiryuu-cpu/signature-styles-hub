import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Phone, Clock, ArrowRight, Scissors } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { data: barbers } = useQuery({
    queryKey: ["barbers", "active"],
    queryFn: async () => {
      const { data } = await supabase.from("barbers").select("*").eq("is_active", true).order("years_of_experience", { ascending: false });
      return data ?? [];
    },
  });

  const { data: info } = useQuery({
    queryKey: ["business_info"],
    queryFn: async () => (await supabase.from("business_info").select("*").maybeSingle()).data,
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", "approved"],
    queryFn: async () => (await supabase.from("reviews").select("*").eq("is_approved", true).order("created_at", { ascending: false })).data ?? [],
  });

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)
    : 4.7;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div className="container mx-auto grid items-center gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs uppercase tracking-widest text-accent">
              <Scissors className="h-3 w-3" /> Yangon · since est.
            </div>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] md:text-7xl">
              Signature <span className="text-accent italic">Hair</span><br />Stylist.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Precision cuts, hot-towel shaves, and stylings crafted by Yangon's
              most considered barbers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/book">Book an appointment <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/reviews">Read reviews</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <strong className="text-foreground">{avgRating.toFixed(1)}</strong> · {reviews?.length ?? 0} reviews
              </span>
              {info?.opening_hours_text && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{info.opening_hours_text}</span>}
            </div>
          </div>

          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border bg-gradient-to-br from-accent/20 via-secondary to-primary/10 shadow-xl">
            <div className="absolute inset-0 flex items-center justify-center">
              <Scissors className="h-40 w-40 text-accent/30" />
            </div>
            <div className="absolute bottom-6 left-6 right-6 rounded-xl bg-background/90 p-4 backdrop-blur">
              {info?.address && <p className="flex items-start gap-2 text-sm"><MapPin className="h-4 w-4 mt-0.5 text-accent" />{info.address}</p>}
              {info?.phone1 && <p className="mt-1 flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-accent" />{info.phone1}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* BARBERS */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-accent">The Team</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">Meet your stylists</h2>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {barbers?.map((b) => (
            <Link key={b.id} to="/barbers/$id" params={{ id: b.id }} className="group">
              <Card className="overflow-hidden transition-all hover:shadow-xl">
                <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                  {b.profile_image_url ? (
                    <img src={b.profile_image_url} alt={b.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-accent/20">
                      <Scissors className="h-16 w-16 text-accent/40" />
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <h3 className="font-display text-2xl">{b.name}</h3>
                  <p className="mt-1 text-xs uppercase tracking-widest text-accent">{b.years_of_experience}+ years</p>
                  {b.bio && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{b.bio}</p>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* REVIEWS PREVIEW */}
      {reviews && reviews.length > 0 && (
        <section className="border-t bg-secondary/40">
          <div className="container mx-auto px-4 py-20">
            <p className="text-sm uppercase tracking-widest text-accent">Word of mouth</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">What our guests say</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {reviews.slice(0, 3).map((r) => (
                <Card key={r.id}><CardContent className="p-6">
                  <div className="flex">
                    {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-accent text-accent" />)}
                  </div>
                  <p className="mt-3 italic text-muted-foreground">"{r.comment}"</p>
                  <p className="mt-4 text-sm font-medium">— {r.customer_name}</p>
                </CardContent></Card>
              ))}
            </div>
            <div className="mt-8"><Button asChild variant="outline"><Link to="/reviews">All reviews & leave yours</Link></Button></div>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
