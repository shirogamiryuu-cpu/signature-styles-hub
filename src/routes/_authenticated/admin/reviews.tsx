import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/reviews")({ component: ReviewsAdmin });

function ReviewsAdmin() {
  const qc = useQueryClient();
  const { data: rows } = useQuery({ queryKey: ["admin-reviews"], queryFn: async () => (await supabase.from("reviews").select("*").order("created_at", { ascending: false })).data ?? [] });

  const approve = async (id: string, v: boolean) => {
    await supabase.from("reviews").update({ is_approved: v }).eq("id", id);
    toast.success(v ? "Approved" : "Unapproved");
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    qc.invalidateQueries({ queryKey: ["reviews", "approved"] });
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  };

  return (
    <div>
      <h1 className="font-display text-4xl">Reviews</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {rows?.map((r: any) => (
          <Card key={r.id} className={r.is_approved ? "" : "border-accent/50 bg-accent/5"}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex">{Array.from({length: r.rating}).map((_, i) => <Star key={i} className="h-4 w-4 fill-accent text-accent" />)}</div>
                <span className="text-xs uppercase tracking-widest text-muted-foreground">{r.is_approved ? "Approved" : "Pending"}</span>
              </div>
              <p className="mt-2 italic">"{r.comment}"</p>
              <p className="mt-2 text-sm font-medium">— {r.customer_name}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => approve(r.id, !r.is_approved)}><Check className="h-3 w-3 mr-1"/>{r.is_approved ? "Unapprove" : "Approve"}</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
