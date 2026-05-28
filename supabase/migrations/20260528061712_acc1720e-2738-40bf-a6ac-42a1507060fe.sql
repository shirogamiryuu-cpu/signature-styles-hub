
CREATE OR REPLACE FUNCTION public.prevent_appointment_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_duration int;
  conflict_count int;
BEGIN
  IF NEW.status NOT IN ('pending','confirmed') OR NEW.barber_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(duration_minutes, 30) INTO new_duration
  FROM public.haircut_styles WHERE id = NEW.style_id;
  IF new_duration IS NULL THEN new_duration := 30; END IF;

  SELECT COUNT(*) INTO conflict_count
  FROM public.appointments a
  JOIN public.haircut_styles s ON s.id = a.style_id
  WHERE a.barber_id = NEW.barber_id
    AND a.status IN ('pending','confirmed')
    AND a.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND tstzrange(
          a.appointment_datetime,
          a.appointment_datetime + make_interval(mins => COALESCE(s.duration_minutes, 30)),
          '[)'
        )
        && tstzrange(
          NEW.appointment_datetime,
          NEW.appointment_datetime + make_interval(mins => new_duration),
          '[)'
        );

  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'This time slot conflicts with another appointment for the selected barber.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_no_overlap ON public.appointments;
CREATE TRIGGER appointments_no_overlap
BEFORE INSERT OR UPDATE OF appointment_datetime, barber_id, style_id, status
ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.prevent_appointment_overlap();
