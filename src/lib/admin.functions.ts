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

export const verifyAdminEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        email: z
          .string()
          .email()
          .max(255)
          .transform((e) => e.trim().toLowerCase()),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const isGmail = /@(gmail\.com|googlemail\.com)$/i.test(data.email);
    if (!isGmail) {
      return { ok: false as const, reason: "Not a Google account (gmail.com)." };
    }

    const { data: list } = await supabaseAdmin.auth.admin.listUsers();
    const user = list?.users?.find(
      (u) => u.email?.toLowerCase() === data.email,
    );

    if (!user) {
      return {
        ok: false as const,
        reason:
          "No account with this email exists yet. Ask them to sign in once with Google on the admin login page.",
      };
    }

    const usedGoogle =
      (user.app_metadata as any)?.provider === "google" ||
      ((user.app_metadata as any)?.providers as string[] | undefined)?.includes("google") ||
      user.identities?.some((i) => i.provider === "google");

    if (!usedGoogle) {
      return {
        ok: false as const,
        reason: "Account exists but has never signed in with Google.",
      };
    }

    // Already an admin?
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    return {
      ok: true as const,
      email: data.email,
      userId: user.id,
      alreadyAdmin: !!existingRole,
      lastSignInAt: user.last_sign_in_at ?? null,
    };
  });


export const createAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        email: z
          .string()
          .email()
          .max(255)
          .refine(
            (e) => /@(gmail\.com|googlemail\.com)$/i.test(e.trim()),
            "Admin email must be a Google account (gmail.com)",
          )
          .transform((e) => e.trim().toLowerCase()),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    // Only promote users that already exist AND have signed in with Google.
    // We never create accounts here — that prevents adding random/fake gmails.
    const { data: list } = await supabaseAdmin.auth.admin.listUsers();
    const user = list?.users?.find(
      (u) => u.email?.toLowerCase() === data.email.toLowerCase(),
    );

    if (!user) {
      throw new Error(
        "This Google account hasn't signed in yet. Ask them to open the admin login page and click 'Continue with Google' once — then add them here.",
      );
    }

    const usedGoogle =
      (user.app_metadata as any)?.provider === "google" ||
      ((user.app_metadata as any)?.providers as string[] | undefined)?.includes("google") ||
      user.identities?.some((i) => i.provider === "google");

    if (!usedGoogle) {
      throw new Error(
        "This account exists but hasn't signed in with Google. Ask them to use 'Continue with Google' on the login page first.",
      );
    }

    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });

    return { email: data.email };
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
