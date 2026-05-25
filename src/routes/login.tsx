import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Scissors, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@signature.com");
  const [password, setPassword] = useState("admin123");
  const [busy, setBusy] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);

  // Auto-bootstrap admin on first visit
  useEffect(() => {
    fetch("/api/public/bootstrap-admin", { method: "POST" }).catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Signed in");
    navigate({ to: "/admin" });
  };

  const ensureBootstrap = async () => {
    setBootstrapping(true);
    try {
      const r = await fetch("/api/public/bootstrap-admin", { method: "POST" }).then((r) => r.json());
      if (r.ok) toast.success(r.created ? "Default admin created" : "Admin already exists");
      else toast.error(r.error || "Bootstrap failed");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBootstrapping(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="p-8">
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent"><ArrowLeft className="h-3 w-3"/>Back</Link>
          <div className="mt-4 flex items-center gap-2">
            <Scissors className="h-5 w-5 text-accent" />
            <span className="font-display text-2xl">Admin sign in</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Signature Hair Stylist staff only.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <Button type="submit" disabled={busy} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground">
            Default: <code>admin@signature.com</code> / <code>admin123</code>.{" "}
            <button onClick={ensureBootstrap} disabled={bootstrapping} className="underline">
              {bootstrapping ? "…" : "Create default admin"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
