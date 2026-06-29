-- Migration 009: Enable pg_cron auto-release of funds after 4 hours
-- Requires pg_cron extension enabled in Supabase dashboard (Extensions > pg_cron)

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'release-timed-out-payments',
  '*/15 * * * *',
  $$
    UPDATE public.payments
    SET status = 'LIBERADO_POR_TIMEOUT', updated_at = now()
    WHERE status = 'SALDO_PAGADO'
      AND updated_at + INTERVAL '4 hours' < now()
      AND NOT EXISTS (
        SELECT 1 FROM public.disputes d
        WHERE d.booking_id = payments.booking_id
          AND d.status = 'open'
      );
  $$
);
