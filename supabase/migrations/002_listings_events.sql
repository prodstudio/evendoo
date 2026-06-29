-- Migration 002: Provider listings and events

CREATE TABLE IF NOT EXISTS public.provider_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL CHECK (category IN ('photography','dj','catering','venue','live_music','decoration','coordinator')),
  title text NOT NULL,
  description text NOT NULL,
  zone text NOT NULL,
  base_price_cents integer NOT NULL CHECK (base_price_cents > 0),
  portfolio_urls text[] DEFAULT '{}' NOT NULL,
  technical_specs jsonb,
  is_available boolean DEFAULT true NOT NULL,
  multi_event boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  event_type text NOT NULL,
  event_date timestamptz NOT NULL,
  zone text NOT NULL,
  estimated_guests integer,
  budget_cents integer,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.calendar_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_date date NOT NULL,
  multi_event boolean DEFAULT false NOT NULL,
  booking_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES public.provider_listings(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(host_id, listing_id)
);

-- RLS
ALTER TABLE public.provider_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listings_public_read" ON public.provider_listings FOR SELECT USING (true);
CREATE POLICY "listings_provider_write" ON public.provider_listings FOR ALL USING (auth.uid() = provider_id);

CREATE POLICY "events_host_own" ON public.events FOR ALL USING (auth.uid() = host_id);

CREATE POLICY "calendar_provider_own" ON public.calendar_blocks FOR ALL USING (auth.uid() = provider_id);

CREATE POLICY "favorites_host_own" ON public.favorites FOR ALL USING (auth.uid() = host_id);

-- Indexes
CREATE INDEX idx_listings_category ON public.provider_listings(category);
CREATE INDEX idx_listings_zone ON public.provider_listings(zone);
CREATE INDEX idx_listings_provider ON public.provider_listings(provider_id);
CREATE INDEX idx_calendar_provider_date ON public.calendar_blocks(provider_id, blocked_date);

-- updated_at triggers
CREATE TRIGGER listings_updated_at BEFORE UPDATE ON public.provider_listings
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();
CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();
