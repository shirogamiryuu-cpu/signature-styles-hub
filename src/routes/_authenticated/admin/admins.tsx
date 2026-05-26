import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAdmins, createAdmin, deleteAdmin, changeMyPassword } from "@/lib/admin.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Trash2, ShieldCheck, KeyRound, UserPlus, Info } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/admins")({ component: AdminsPage });

function AdminsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const fetchList = useServerFn(listAdmins);
  const create = useServerFn(createAdmin);
  const remove = useServerFn(deleteAdmin);
  const changePw = useServerFn(changeMyPassword);

  const { data: admins, isLoading } = useQuery({
    queryKey: ["admins"],
    queryFn: () => fetchList(),
  });

  const [email, setEmail] = useState("");
  const [issued, setIssued] = useState<{ email: string } | null>(null);

  const createMut = useMutation({
    mutationFn: () => create({ data: { email } }),
    onSuccess: (r) => {
      setIssued(r);
      setEmail("");
      qc.invalidateQueries({ queryKey: ["admins"] });
      toast.success(`${r.email} is now an admin.`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeMut = useMutation({
    mutationFn: (userId: string) => remove({ data: { userId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Admin removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const pwMut = useMutation({
    mutationFn: () => changePw({ data: { currentPassword: curPw, newPassword: newPw } }),
    onSuccess: () => {
      toast.success("Password changed");
      setCurPw(""); setNewPw(""); setConfirmPw("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const submitPw = () => {
    if (newPw.length < 8) return toast.error("Password must be at least 8 characters.");
    if (newPw !== confirmPw) return toast.error("Passwords do not match.");
    pwMut.mutate();
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-4xl">Admins</h1>
        <p className="text-muted-foreground">Manage staff with access to this console.</p>
      </div>

      {/* Create admin */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-accent" />
            <h2 className="font-display text-2xl">Add new admin</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <Label>Google account email</Label>
              <Input type="email" placeholder="name@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button
              onClick={() => {
                if (!/@(gmail\.com|googlemail\.com)$/i.test(email.trim())) {
                  toast.error("Please enter a Google account (gmail.com).");
                  return;
                }
                createMut.mutate();
              }}
              disabled={!email || createMut.isPending}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {createMut.isPending ? "Creating…" : "Create admin"}
            </Button>
          </div>
          <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p>
              The person must first open the admin login page and click <strong>Continue with Google</strong> at least once. Then enter their Gmail here to grant admin access. Random or non-existent Gmail addresses will be rejected.
            </p>
          </div>

          {issued && (
            <div className="rounded-md border border-accent/40 bg-accent/5 p-4 text-sm">
              <strong>{issued.email}</strong> has been granted admin access. They can now sign in with Google.
            </div>
          )}
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <h2 className="font-display text-2xl">Current admins</h2>
          </div>
          <div className="mt-4 rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr><th className="p-3">Email</th><th className="p-3">Last sign-in</th><th className="p-3">Granted</th><th className="p-3 w-16"></th></tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
                {admins?.map((a) => (
                  <tr key={a.user_id} className="border-b last:border-0">
                    <td className="p-3">{a.email} {a.user_id === user?.id && <span className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">you</span>}</td>
                    <td className="p-3 text-muted-foreground">{a.last_sign_in_at ? new Date(a.last_sign_in_at).toLocaleString() : "—"}</td>
                    <td className="p-3 text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      {a.user_id !== user?.id && (
                        <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Remove admin access for ${a.email}?`)) removeMut.mutate(a.user_id); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {admins && admins.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No admins.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Change my password */}
      <Card>
        <CardContent className="p-6 space-y-4 max-w-lg">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-accent" />
            <h2 className="font-display text-2xl">Change my password</h2>
          </div>
          <div><Label>Current password</Label><Input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} /></div>
          <div><Label>New password</Label><Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} /></div>
          <div><Label>Confirm new password</Label><Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} /></div>
          <Button onClick={submitPw} disabled={pwMut.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {pwMut.isPending ? "Updating…" : "Update password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
