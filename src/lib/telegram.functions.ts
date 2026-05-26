import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const notifyAppointment = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ appointmentId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (!token || !chatId) {
      console.warn("Telegram not configured; skipping notification.");
      return { ok: false, skipped: true };
    }

    const { data: appt, error } = await supabaseAdmin
      .from("appointments")
      .select("*, barbers(name), haircut_styles(name, price)")
      .eq("id", data.appointmentId)
      .maybeSingle();

    if (error || !appt) {
      return { ok: false, error: error?.message ?? "Appointment not found" };
    }

    const when = new Date(appt.appointment_datetime as string);
    const text =
      `<b>New appointment request</b>\n` +
      `👤 ${appt.customer_name}\n` +
      `📞 ${appt.customer_phone}\n` +
      (appt.customer_email ? `✉️ ${appt.customer_email}\n` : "") +
      `💇 Style: ${(appt as any).haircut_styles?.name ?? "—"}\n` +
      `✂️ Barber: ${(appt as any).barbers?.name ?? "—"}\n` +
      `🗓 ${when.toLocaleString()}\n` +
      (appt.notes ? `📝 ${appt.notes}\n` : "") +
      `\nStatus: ${appt.status}`;

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        console.error("Telegram error", body);
        return { ok: false, error: body.description ?? `HTTP ${res.status}` };
      }
      return { ok: true };
    } catch (e: any) {
      console.error("Telegram fetch failed", e);
      return { ok: false, error: e.message };
    }
  });
