
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_id uuid;

DROP POLICY IF EXISTS "Public submit reviews" ON public.reviews;

CREATE POLICY "Authenticated users submit reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (is_approved = false AND user_id = auth.uid());
