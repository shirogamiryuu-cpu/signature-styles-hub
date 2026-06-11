import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Check, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

type Notif = {
  id: string;
  audience: "admin" | "user";
  user_id: string | null;
  appointment_id: string | null;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
};

type Props = { audience: "admin" | "user"; userId: string };

export function NotificationBell({ audience, userId }: Props) {
  const navigate = useNavigate();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);

  const load = useCallback(async () => {
    let q = supabase
      .from("notifications")
      .select("*")
      .eq("audience", audience)
      .order("created_at", { ascending: false })
      .limit(30);
    if (audience === "user") q = q.eq("user_id", userId);
    const { data } = await q;
    setItems((data ?? []) as Notif[]);
  }, [audience, userId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`notif-${audience}-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload: any) => {
          const row = payload.new ?? payload.old;
          if (!row) return;
          if (row.audience !== audience) return;
          if (audience === "user" && row.user_id !== userId) return;
          if (payload.eventType === "INSERT") {
            toast(row.title, { description: row.body ?? undefined });
          }
          load();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [audience, userId, load]);

  const unread = items.filter((i) => !i.is_read).length;

  const openNotif = async (n: Notif) => {
    if (!n.is_read) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", n.id);
    }
    if (n.appointment_id) {
      const { data } = await supabase
        .from("appointments")
        .select("*, barbers(name), haircut_styles(name, price, duration_minutes)")
        .eq("id", n.appointment_id)
        .maybeSingle();
      setDetail(data);
      setOpen(false);
    }
  };

  const markAllRead = async () => {
    const ids = items.filter((i) => !i.is_read).map((i) => i.id);
    if (ids.length === 0) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", ids);
    load();
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
                <Check className="mr-1 h-3 w-3" />Mark all read
              </Button>
            )}
          </div>
          <ScrollArea className="max-h-96">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              <ul className="divide-y">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => openNotif(n)}
                      className={`flex w-full gap-2 px-3 py-2.5 text-left transition hover:bg-accent/30 ${!n.is_read ? "bg-accent/10" : ""}`}
                    >
                      <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{n.title}</p>
                        {n.body && <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
                        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!n.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment details</DialogTitle>
            <DialogDescription>
              {detail && new Date(detail.appointment_datetime).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-2 text-sm">
              <Row label="Customer" value={detail.customer_name} />
              <Row label="Phone" value={detail.customer_phone} />
              {detail.customer_email && <Row label="Email" value={detail.customer_email} />}
              <Row label="Style" value={detail.haircut_styles?.name ?? "—"} />
              <Row label="Barber" value={detail.barbers?.name ?? "—"} />
              <Row label="Status" value={<span className="capitalize">{detail.status}</span>} />
              {detail.haircut_styles?.price != null && (
                <Row label="Price" value={`${Number(detail.haircut_styles.price).toLocaleString()} MMK`} />
              )}
              {detail.notes && <Row label="Notes" value={detail.notes} />}
              {audience === "admin" && (
                <div className="pt-3">
                  <Button
                    size="sm"
                    onClick={() => {
                      setDetail(null);
                      navigate({ to: "/admin/appointments" });
                    }}
                  >
                    Manage in admin
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b pb-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
