
-- 1. user_id on appointments (link to signed-in customer if available)
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);

-- 2. notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience text NOT NULL CHECK (audience IN ('admin','user')),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_audience ON public.notifications(audience, created_at DESC);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Admins read/update admin-audience rows
CREATE POLICY "Admins read admin notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (audience = 'admin' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update admin notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (audience = 'admin' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (audience = 'admin' AND public.has_role(auth.uid(), 'admin'));

-- Users read/update their own notifications
CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (audience = 'user' AND user_id = auth.uid());

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (audience = 'user' AND user_id = auth.uid())
  WITH CHECK (audience = 'user' AND user_id = auth.uid());

-- 3. Trigger: on new appointment, notify admin + signed-in user
CREATE OR REPLACE FUNCTION public.notify_on_appointment_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_style text;
  v_when text;
BEGIN
  SELECT name INTO v_style FROM public.haircut_styles WHERE id = NEW.style_id;
  v_when := to_char(NEW.appointment_datetime AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI');

  -- Admin notification
  INSERT INTO public.notifications (audience, appointment_id, type, title, body)
  VALUES (
    'admin', NEW.id, 'appointment_created',
    'New booking: ' || COALESCE(NEW.customer_name, 'Customer'),
    COALESCE(v_style, 'Appointment') || ' on ' || v_when
  );

  -- User notification (only if signed in)
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (audience, user_id, appointment_id, type, title, body)
    VALUES (
      'user', NEW.user_id, NEW.id, 'appointment_submitted',
      'Booking request received',
      COALESCE(v_style, 'Appointment') || ' on ' || v_when || ' — we''ll confirm shortly.'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_appointment_insert ON public.appointments;
CREATE TRIGGER trg_notify_appointment_insert
  AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_appointment_insert();

-- 4. Trigger: on status change, notify the user
CREATE OR REPLACE FUNCTION public.notify_on_appointment_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_style text;
  v_when text;
BEGIN
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;

  SELECT name INTO v_style FROM public.haircut_styles WHERE id = NEW.style_id;
  v_when := to_char(NEW.appointment_datetime AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI');

  INSERT INTO public.notifications (audience, user_id, appointment_id, type, title, body)
  VALUES (
    'user', NEW.user_id, NEW.id, 'appointment_status_' || NEW.status,
    'Booking ' || NEW.status,
    'Your ' || COALESCE(v_style, 'appointment') || ' on ' || v_when || ' is now ' || NEW.status || '.'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_appointment_status ON public.appointments;
CREATE TRIGGER trg_notify_appointment_status
  AFTER UPDATE OF status ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_appointment_status_change();

REVOKE EXECUTE ON FUNCTION public.notify_on_appointment_insert() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_appointment_status_change() FROM anon, authenticated;

-- 5. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
