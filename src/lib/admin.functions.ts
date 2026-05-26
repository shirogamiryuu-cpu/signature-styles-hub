import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let pw = "";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  for (const b of bytes) pw += chars[b % chars.length];
  return pw + "!";
}

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, created_at")
      .eq("role", "admin");
    const { data: list } = await supabaseAdmin.auth.admin.listUsers();
    const byId = new Map(list?.users?.map((u) => [u.id, u]) ?? []);
    return (roles ?? []).map((r) => {
      const u = byId.get(r.user_id);
      return {
        user_id: r.user_id,
        email: u?.email ?? "(unknown)",
        created_at: r.created_at,
        last_sign_in_at: u?.last_sign_in_at ?? null,
      };
    });
  });

export const createAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ email: z.string().email().max(255) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const tempPassword = generateTempPassword();

    // Find or create user
    const { data: list } = await supabaseAdmin.auth.admin.listUsers();
    let user = list?.users?.find(
      (u) => u.email?.toLowerCase() === data.email.toLowerCase(),
    );

    if (!user) {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: tempPassword,
        email_confirm: true,
      });
      if (error || !created.user) throw new Error(error?.message ?? "Failed to create user");
      user = created.user;
    } else {
      // Reset password to temporary
      await supabaseAdmin.auth.admin.updateUserById(user.id, { password: tempPassword });
    }

    // Grant admin role (ignore conflict)
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });

    return { email: data.email, tempPassword };
  });

export const deleteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.userId === context.userId) {
      throw new Error("You cannot remove your own admin role.");
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "admin");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const changeMyPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8).max(128),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const email = (context.claims as any)?.email as string | undefined;
    if (!email) throw new Error("No email on session");

    // Verify current password
    const { error: signInErr } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password: data.currentPassword,
    });
    if (signInErr) throw new Error("Current password is incorrect");

    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      password: data.newPassword,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
