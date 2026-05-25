import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DEFAULT_EMAIL = "admin@signature.com";
const DEFAULT_PASSWORD = "admin123";

export const Route = createFileRoute("/api/public/bootstrap-admin")({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
});

async function handler() {
  // Check if any admin already exists
  const { data: existing } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin")
    .limit(1);

  if (existing && existing.length > 0) {
    return Response.json({ ok: true, created: false, message: "Admin already exists" });
  }

  // Try to find existing user with the default email; create if missing
  const { data: list } = await supabaseAdmin.auth.admin.listUsers();
  let userId = list?.users?.find((u) => u.email?.toLowerCase() === DEFAULT_EMAIL)?.id;

  if (!userId) {
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: DEFAULT_EMAIL,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
    });
    if (error || !created.user) {
      return Response.json({ ok: false, error: error?.message ?? "create failed" }, { status: 500 });
    }
    userId = created.user.id;
  }

  const { error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: userId, role: "admin" });

  if (roleErr) {
    return Response.json({ ok: false, error: roleErr.message }, { status: 500 });
  }

  return Response.json({
    ok: true,
    created: true,
    email: DEFAULT_EMAIL,
    password: DEFAULT_PASSWORD,
  });
}
