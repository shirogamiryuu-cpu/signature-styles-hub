import { Link } from "@tanstack/react-router";
import { Scissors } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { NotificationBell } from "@/components/NotificationBell";

export function SiteHeader() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Scissors className="h-5 w-5 text-accent" />
          <span className="font-display text-xl tracking-tight">Signature <span className="text-accent">Hair</span></span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link to="/" className="hover:text-accent" activeOptions={{ exact: true }} activeProps={{ className: "text-accent" }}>Home</Link>
          <Link to="/book" className="hover:text-accent" activeProps={{ className: "text-accent" }}>Book</Link>
          <Link to="/reviews" className="hover:text-accent" activeProps={{ className: "text-accent" }}>Reviews</Link>
          <Link to="/login" className="text-muted-foreground hover:text-accent">Admin</Link>
          {user && <NotificationBell audience="user" userId={user.id} />}
        </nav>
      </div>
    </header>
  );
}
