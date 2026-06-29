-- Migration 006: TOTP secrets for check-in (service_role only)

CREATE TABLE IF NOT EXISTS public.totp_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL UNIQUE,
  secret text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- NO client RLS policies — service_role access only
ALTER TABLE public.totp_secrets ENABLE ROW LEVEL SECURITY;
-- (no policies = only service_role can access)

CREATE INDEX idx_totp_booking ON public.totp_secrets(booking_id);
