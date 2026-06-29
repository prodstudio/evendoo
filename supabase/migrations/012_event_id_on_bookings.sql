-- Migration 012: link bookings to events (nullable, backwards-compatible)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id) ON DELETE SET NULL;
