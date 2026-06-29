-- Migration 003: Bookings and payments with full state machine

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  provider_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES public.provider_listings(id) ON DELETE CASCADE NOT NULL,
  event_date timestamptz NOT NULL,
  event_type text NOT NULL,
  event_zone text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','declined','cancelled')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('deposit','balance')),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  status text NOT NULL DEFAULT 'SEÑA_PENDIENTE'
    CHECK (status IN (
      'SEÑA_PENDIENTE','SEÑA_PAGADA','CANCELADO_POST_SEÑA',
      'SALDO_PENDIENTE','SALDO_PAGADO','CHECK_IN_VALIDADO',
      'SALDO_LIBERADO','LIBERADO_POR_TIMEOUT',
      'DISPUTA_ABIERTA','DISPUTA_RESUELTA'
    )),
  mp_payment_id text,
  idempotency_key uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(idempotency_key)
);

-- RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_participant" ON public.bookings FOR ALL
  USING (auth.uid() = host_id OR auth.uid() = provider_id);

CREATE POLICY "payments_participant" ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = payments.booking_id
      AND (b.host_id = auth.uid() OR b.provider_id = auth.uid())
    )
  );

-- Only service role can update payment status
CREATE POLICY "payments_service_write" ON public.payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = payments.booking_id
      AND b.host_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_bookings_host ON public.bookings(host_id);
CREATE INDEX idx_bookings_provider ON public.bookings(provider_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_payments_booking ON public.payments(booking_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_mp ON public.payments(mp_payment_id);

-- updated_at triggers
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

-- pg_cron: auto-release payments after 4 hours (requires pg_cron extension)
-- Run after enabling pg_cron in Supabase dashboard:
-- SELECT cron.schedule(
--   'release-timed-out-payments',
--   '*/15 * * * *',
--   $$
--     UPDATE public.payments
--     SET status = 'LIBERADO_POR_TIMEOUT', updated_at = now()
--     WHERE status = 'SALDO_PAGADO'
--       AND updated_at + INTERVAL '4 hours' < now()
--       AND NOT EXISTS (
--         SELECT 1 FROM public.disputes d
--         WHERE d.booking_id = payments.booking_id
--         AND d.status = 'open'
--       );
--   $$
-- );
