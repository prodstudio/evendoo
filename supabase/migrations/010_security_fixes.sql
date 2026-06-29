-- ============================================================
-- P3: RLS UPDATE policy for payments (was missing entirely)
-- ============================================================
CREATE POLICY "payments_participant_update" ON public.payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = payments.booking_id
        AND (b.host_id = auth.uid() OR b.provider_id = auth.uid())
    )
  );

-- ============================================================
-- P4: Allow booking participants to read totp_secrets
-- (previously RLS enabled with zero policies = always null)
-- ============================================================
CREATE POLICY "totp_secrets_participant_select" ON public.totp_secrets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = totp_secrets.booking_id
        AND (b.host_id = auth.uid() OR b.provider_id = auth.uid())
    )
  );

-- ============================================================
-- P5: Allow booking participants to INSERT checkins
-- (previously no INSERT policy = check-in writes silently blocked)
-- ============================================================
CREATE POLICY "checkins_participant_insert" ON public.checkins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = checkins.booking_id
        AND (b.host_id = auth.uid() OR b.provider_id = auth.uid())
    )
  );

-- ============================================================
-- P7: Create withdrawals table (was missing from all migrations)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  bank_alias text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "withdrawals_provider_own" ON public.withdrawals FOR ALL
  USING (auth.uid() = provider_id);

-- ============================================================
-- P8: Fix bookings_participant FOR ALL → split to prevent
-- providers from inserting bookings with arbitrary host_id
-- ============================================================
DROP POLICY IF EXISTS "bookings_participant" ON public.bookings;

CREATE POLICY "bookings_participant_select" ON public.bookings FOR SELECT
  USING (auth.uid() = host_id OR auth.uid() = provider_id);

CREATE POLICY "bookings_host_insert" ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "bookings_participant_update" ON public.bookings FOR UPDATE
  USING (auth.uid() = host_id OR auth.uid() = provider_id);

-- ============================================================
-- P11: Atomic withdrawal function (prevents double-spend race)
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_withdrawal(
  p_provider_id uuid,
  p_amount_cents integer,
  p_bank_alias text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available integer;
  v_withdrawal_id uuid;
BEGIN
  -- Lock payment rows to serialize concurrent withdrawals
  SELECT COALESCE(SUM(p.amount_cents), 0) INTO v_available
  FROM public.payments p
  JOIN public.bookings b ON b.id = p.booking_id
  WHERE p.status IN ('SALDO_LIBERADO', 'LIBERADO_POR_TIMEOUT')
    AND b.provider_id = p_provider_id
  FOR UPDATE OF p;

  IF p_amount_cents > v_available THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  INSERT INTO public.withdrawals (provider_id, amount_cents, bank_alias, status)
  VALUES (p_provider_id, p_amount_cents, p_bank_alias, 'pending')
  RETURNING id INTO v_withdrawal_id;

  RETURN v_withdrawal_id;
END;
$$;

-- ============================================================
-- P13: Partial unique index on disputes.booking_id
-- Prevents concurrent duplicate open disputes per booking
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS disputes_booking_open_unique
  ON public.disputes (booking_id)
  WHERE status = 'open';

-- ============================================================
-- P14: Add saldo_pagado_at to payments for accurate timeout
-- The cron now anchors on when the balance was paid, not
-- the last time any UPDATE touched the row
-- ============================================================
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS saldo_pagado_at timestamptz;

SELECT cron.unschedule('release-timed-out-payments');

SELECT cron.schedule(
  'release-timed-out-payments',
  '*/15 * * * *',
  $$
    UPDATE public.payments
    SET status = 'LIBERADO_POR_TIMEOUT', updated_at = now()
    WHERE status = 'SALDO_PAGADO'
      AND COALESCE(saldo_pagado_at, updated_at) + INTERVAL '4 hours' < now()
      AND NOT EXISTS (
        SELECT 1 FROM public.disputes d
        WHERE d.booking_id = payments.booking_id
          AND d.status = 'open'
      );
  $$
);

-- ============================================================
-- P16: Unique partial index to prevent duplicate active bookings
-- at DB level (was only checked via application query before)
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS bookings_no_active_duplicate
  ON public.bookings (host_id, provider_id, event_date)
  WHERE status IN ('pending', 'accepted');

-- ============================================================
-- P19: Allow providers to view disputes filed against them
-- (existing policy only allowed opener to read)
-- ============================================================
CREATE POLICY "disputes_provider_view" ON public.disputes FOR SELECT
  USING (
    auth.uid() = opened_by
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = disputes.booking_id
        AND b.provider_id = auth.uid()
    )
  );

-- ============================================================
-- P26: Index on disputes.booking_id for cron NOT EXISTS query
-- ============================================================
CREATE INDEX IF NOT EXISTS disputes_booking_id_idx
  ON public.disputes (booking_id);
