-- Migration 011: accept_booking SECURITY DEFINER function
-- Atomically accepts a booking: updates status, creates payment rows,
-- stores pre-generated TOTP secret. Avoids service_role key on app side.

CREATE OR REPLACE FUNCTION public.accept_booking(
  p_booking_id uuid,
  p_totp_secret text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_price integer;
  v_deposit    integer;
  v_balance    integer;
BEGIN
  -- Verify caller is the provider and booking is still pending
  IF NOT EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = p_booking_id
      AND b.provider_id = auth.uid()
      AND b.status = 'pending'
  ) THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND_OR_UNAUTHORIZED';
  END IF;

  -- Fetch listing base price
  SELECT pl.base_price_cents INTO v_base_price
  FROM public.bookings b
  JOIN public.provider_listings pl ON pl.id = b.listing_id
  WHERE b.id = p_booking_id;

  -- 30 / 70 split
  v_deposit := ROUND(v_base_price * 0.30);
  v_balance  := v_base_price - v_deposit;

  -- Transition booking
  UPDATE public.bookings
  SET status = 'accepted', updated_at = now()
  WHERE id = p_booking_id;

  -- Create escrow payment rows
  INSERT INTO public.payments (booking_id, type, amount_cents, status)
  VALUES
    (p_booking_id, 'deposit',  v_deposit, 'SEÑA_PENDIENTE'),
    (p_booking_id, 'balance',  v_balance, 'SALDO_PENDIENTE');

  -- Store check-in TOTP secret (provider-supplied, generated in Node.js)
  INSERT INTO public.totp_secrets (booking_id, secret)
  VALUES (p_booking_id, p_totp_secret)
  ON CONFLICT (booking_id) DO UPDATE SET secret = EXCLUDED.secret;
END;
$$;
