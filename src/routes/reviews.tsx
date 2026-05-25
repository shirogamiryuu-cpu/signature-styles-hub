import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reviews")({ component: ReviewsPage });

function ReviewsPage() {
  const qc = useQueryClient();
  const { data: reviews } = useQuery({
    queryKey: ["reviews", "approved"],
    queryFn: async () => (await supabase.from("reviews").select("*").eq("is_approved", true).order("created_at", { ascending: false })).data ?? [],
  });

  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name || !comment) { toast.error("Please add your name and review."); return; }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({ customer_name: name, rating, comment, is_approved: false });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Thank you! Your review will appear after approval.");
    setName(""); setComment(""); setRating(5);
    qc.invalidateQueries({ queryKey: ["reviews"] });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <p className="text-sm uppercase tracking-widest text-accent">Guest experiences</p>
        <h1 className="mt-2 font-display text-5xl">Reviews</h1>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {reviews?.map((r) => (
            <Card key={r.id}><CardContent className="p-6">
              <div className="flex">{Array.from({length: r.rating}).map((_,i) => <Star key={i} className="h-4 w-4 fill-accent text-accent" />)}</div>
              <p className="mt-3 italic text-muted-foreground">"{r.comment}"</p>
              <p className="mt-4 text-sm font-medium">— {r.customer_name}</p>
            </CardContent></Card>
          ))}
        </div>

        <Card className="mt-12">
          <CardContent className="space-y-4 p-6">
            <h2 className="font-display text-2xl">Leave a review</h2>
            <div><Label>Your name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div>
              <Label>Rating</Label>
              <div className="mt-1 flex gap-1">
                {[1,2,3,4,5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)}>
                    <Star className={`h-6 w-6 ${n<=rating?"fill-accent text-accent":"text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div><Label>Your review</Label><Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} /></div>
            <Button onClick={submit} disabled={submitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {submitting ? "Submitting…" : "Submit review"}
            </Button>
          </CardContent>
        </Card>
      </div>
      <SiteFooter />
    </div>
  );
}
