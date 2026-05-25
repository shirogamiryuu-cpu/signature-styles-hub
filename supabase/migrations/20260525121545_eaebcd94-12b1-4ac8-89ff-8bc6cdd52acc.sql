
-- ============= ENUMS =============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- ============= USER ROLES (secure pattern) =============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= BARBERS =============
CREATE TABLE public.barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  specialties TEXT[] DEFAULT '{}',
  years_of_experience INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active barbers" ON public.barbers
  FOR SELECT TO anon, authenticated USING (is_active = TRUE OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage barbers" ON public.barbers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============= HAIRCUT STYLES =============
CREATE TABLE public.haircut_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 30,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  style_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.haircut_styles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active styles" ON public.haircut_styles
  FOR SELECT TO anon, authenticated USING (is_active = TRUE OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage styles" ON public.haircut_styles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============= BARBER <-> STYLE MAP =============
CREATE TABLE public.barber_style_map (
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  style_id UUID NOT NULL REFERENCES public.haircut_styles(id) ON DELETE CASCADE,
  PRIMARY KEY (barber_id, style_id)
);
ALTER TABLE public.barber_style_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view mapping" ON public.barber_style_map
  FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Admins manage mapping" ON public.barber_style_map
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============= APPOINTMENTS =============
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  appointment_datetime TIMESTAMPTZ NOT NULL,
  barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
  style_id UUID REFERENCES public.haircut_styles(id) ON DELETE SET NULL,
  status public.appointment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can create appointments" ON public.appointments
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending');
CREATE POLICY "Admins view appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============= HAIRCUT REGISTERS =============
CREATE TABLE public.haircut_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE RESTRICT,
  style_id UUID NOT NULL REFERENCES public.haircut_styles(id) ON DELETE RESTRICT,
  customer_name TEXT,
  customer_phone TEXT,
  date_performed TIMESTAMPTZ NOT NULL DEFAULT now(),
  price_charged NUMERIC(10,2),
  notes TEXT,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.haircut_registers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage registers" ON public.haircut_registers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Auto-create register when appointment marked completed
CREATE OR REPLACE FUNCTION public.handle_appointment_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price NUMERIC;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    IF NEW.barber_id IS NOT NULL AND NEW.style_id IS NOT NULL THEN
      SELECT price INTO v_price FROM public.haircut_styles WHERE id = NEW.style_id;
      INSERT INTO public.haircut_registers
        (barber_id, style_id, customer_name, customer_phone, date_performed, price_charged, appointment_id, notes)
      VALUES
        (NEW.barber_id, NEW.style_id, NEW.customer_name, NEW.customer_phone, NEW.appointment_datetime, v_price, NEW.id, NEW.notes);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_appointment_completed
AFTER UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.handle_appointment_completed();

-- ============= REVIEWS =============
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view approved reviews" ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (is_approved = TRUE OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public submit reviews" ON public.reviews
  FOR INSERT TO anon, authenticated
  WITH CHECK (is_approved = FALSE);
CREATE POLICY "Admins manage reviews" ON public.reviews
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============= BUSINESS INFO =============
CREATE TABLE public.business_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT,
  phone1 TEXT,
  phone2 TEXT,
  phone3 TEXT,
  opening_hours_text TEXT,
  facebook_url TEXT,
  google_maps_embed_link TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.business_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view business info" ON public.business_info
  FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Admins update business info" ON public.business_info
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============= STORAGE BUCKETS =============
INSERT INTO storage.buckets (id, name, public) VALUES
  ('barber-images', 'barber-images', TRUE),
  ('style-images', 'style-images', TRUE);

CREATE POLICY "Public read barber images" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'barber-images');
CREATE POLICY "Admins write barber images" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'barber-images' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'barber-images' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Public read style images" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'style-images');
CREATE POLICY "Admins write style images" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'style-images' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'style-images' AND public.has_role(auth.uid(),'admin'));
