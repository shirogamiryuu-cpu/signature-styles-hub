
-- Revoke broad execute on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_appointment_completed() FROM PUBLIC, anon, authenticated;

-- Replace broad bucket read policies with object-by-name only (no listing)
DROP POLICY IF EXISTS "Public read barber images" ON storage.objects;
DROP POLICY IF EXISTS "Public read style images" ON storage.objects;

CREATE POLICY "Public read specific barber image" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'barber-images' AND name IS NOT NULL);

CREATE POLICY "Public read specific style image" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'style-images' AND name IS NOT NULL);
