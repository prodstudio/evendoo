CREATE TABLE IF NOT EXISTS public.event_saved_listings (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id   uuid        NOT NULL REFERENCES public.events(id)            ON DELETE CASCADE,
  listing_id uuid        NOT NULL REFERENCES public.provider_listings(id) ON DELETE CASCADE,
  added_by   uuid        NOT NULL REFERENCES auth.users(id)               ON DELETE CASCADE,
  added_at   timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT event_saved_listings_unique UNIQUE (event_id, listing_id)
);

ALTER TABLE public.event_saved_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "host can manage their event saved listings"
  ON public.event_saved_listings
  FOR ALL
  USING  (added_by = auth.uid())
  WITH CHECK (added_by = auth.uid());
