-- Migration 007: Disputes and check-in records

CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  opened_by uuid REFERENCES public.profiles(id) NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  resolution_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL UNIQUE,
  validated_by uuid REFERENCES public.profiles(id) NOT NULL,
  validated_at timestamptz NOT NULL DEFAULT now(),
  token_used text NOT NULL
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "disputes_host_own" ON public.disputes FOR ALL
  USING (auth.uid() = opened_by);

CREATE POLICY "checkins_participant" ON public.checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = checkins.booking_id
      AND (b.host_id = auth.uid() OR b.provider_id = auth.uid())
    )
  );

CREATE TRIGGER disputes_updated_at BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.checkins;
