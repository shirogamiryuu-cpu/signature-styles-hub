
REVOKE EXECUTE ON FUNCTION public.notify_on_appointment_insert() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_appointment_status_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_appointment_completed() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_appointment_overlap() FROM PUBLIC, anon, authenticated;
