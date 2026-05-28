import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth, signOut } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, LogOut } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reviews")({ component: ReviewsPage });

function ReviewsPage() {
  const qc = useQueryClient();
  const { user, loading } = useAuth();

  const { data: reviews } = useQuery({
    queryKey: ["reviews", "approved"],
    queryFn: async () =>
      (await supabase.from("reviews").select("*").eq("is_approved", true).order("created_at", { ascending: false })).data ?? [],
  });

  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) {
      toast.error("Please sign in to submit a review.");
      return;
    }
    if (!name || !comment) {
      toast.error("Please add your name and review.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("reviews")
      .insert({ customer_name: name, rating, comment, is_approved: false, user_id: user.id });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Thank you! Your review will appear after approval.");
    setName("");
    setComment("");
    setRating(5);
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
            <Card key={r.id}>
              <CardContent className="p-6">
                <div className="flex">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="mt-3 italic text-muted-foreground">"{r.comment}"</p>
                <p className="mt-4 text-sm font-medium">— {r.customer_name}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-12">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Leave a review</h2>
              {user && (
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  <LogOut className="mr-1 h-3 w-3" /> Sign out
                </Button>
              )}
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !user ? (
              <SignInGate />
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Signed in as {user.email}</p>
                <div>
                  <Label>Your name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label>Rating</Label>
                  <div className="mt-1 flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setRating(n)}>
                        <Star className={`h-6 w-6 ${n <= rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Your review</Label>
                  <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} />
                </div>
                <Button onClick={submit} disabled={submitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {submitting ? "Submitting…" : "Submit review"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <SiteFooter />
    </div>
  );
}

function SignInGate() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/reviews" });
    if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
  };

  const emailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Email and password required.");
    setBusy(true);
    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/reviews" } });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(mode === "signin" ? "Signed in" : "Check your email to confirm your account.");
  };

  return (
    <div className="space-y-4 rounded-md border bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground">
        To prevent spam, please sign in before submitting a review.
      </p>

      <Button type="button" variant="outline" className="w-full" onClick={google}>
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={emailAuth} className="space-y-3">
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
        <button
          type="button"
          className="text-xs text-muted-foreground underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "No account? Sign up" : "Have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
