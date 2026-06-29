-- RLS Policy Patterns for Evendoo
-- This migration documents the RLS patterns used across all tables.
-- Applied per-table in subsequent migrations.

-- Pattern 1: Own record only
-- CREATE POLICY "own_record" ON table_name
--   FOR ALL USING (auth.uid() = user_id_column);

-- Pattern 2: Participant access (host or provider)
-- CREATE POLICY "participant_access" ON bookings
--   FOR ALL USING (auth.uid() = host_id OR auth.uid() = provider_id);

-- Pattern 3: Service role only (for secrets)
-- No client policies — only service_role can access

-- Enable RLS helper reminder: ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

SELECT 1; -- placeholder for migration runner
