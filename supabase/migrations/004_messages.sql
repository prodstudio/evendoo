-- Migration 004: Messages and invoice attachments

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  body text NOT NULL,
  attachment_url text,
  attachment_type text CHECK (attachment_type IN ('pdf','image') OR attachment_type IS NULL),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_participant" ON public.messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = messages.booking_id
      AND (b.host_id = auth.uid() OR b.provider_id = auth.uid())
    )
  );

-- Realtime: enable for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

-- Index
CREATE INDEX idx_messages_booking ON public.messages(booking_id, created_at);
