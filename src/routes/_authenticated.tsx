import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({ component: Gate });

function Gate() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
        <h1 className="font-display text-3xl">Not authorized</h1>
        <p className="text-muted-foreground">Your account does not have admin access.</p>
      </div>
    );
  }
  return <Outlet />;
}
