-- SAV échelle (200k visiteurs/jour) : plafond budgétaire IA + relances J+3.
-- À COLLER DANS LE SQL EDITOR SUPABASE après 2026-06-12_platform_feedback.sql.

-- 1) Compteurs quotidiens durables (multi-instances Vercel) : plafonne le coût
--    IA de l'agent SAV. RPC jsonb scalaire (pattern leçon 08/06, dodge cap 1000).
CREATE TABLE IF NOT EXISTS daily_counters (
  day date NOT NULL,
  name text NOT NULL,
  value integer NOT NULL DEFAULT 0,
  PRIMARY KEY (day, name)
);
ALTER TABLE daily_counters ENABLE ROW LEVEL SECURITY; -- interne : aucune policy

CREATE OR REPLACE FUNCTION increment_daily_counter(counter_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE new_value integer;
BEGIN
  INSERT INTO daily_counters (day, name, value)
  VALUES (CURRENT_DATE, counter_name, 1)
  ON CONFLICT (day, name) DO UPDATE SET value = daily_counters.value + 1
  RETURNING value INTO new_value;
  RETURN jsonb_build_object('value', new_value);
END;
$$;

-- 2) Relance feedback J+3 (audit trail obligatoire, leçon 23/05) :
ALTER TABLE projects ADD COLUMN IF NOT EXISTS feedback_request_sent_at timestamptz;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS feedback_request_sent_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_projects_feedback_pending
  ON projects (created_at) WHERE feedback_request_sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pros_feedback_pending
  ON pros (claimed_at) WHERE feedback_request_sent_at IS NULL AND claimed_by_user_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
