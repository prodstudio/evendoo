-- Migration 005: AI planning sessions

CREATE TABLE IF NOT EXISTS public.ai_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment','active','expired')),
  conversation jsonb DEFAULT '[]' NOT NULL,
  mp_payment_id text,
  activated_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_sessions_host_own" ON public.ai_sessions FOR ALL
  USING (auth.uid() = host_id);

CREATE INDEX idx_ai_sessions_host ON public.ai_sessions(host_id);
