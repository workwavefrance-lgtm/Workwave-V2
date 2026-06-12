-- Agent IA SAV : retours utilisateurs (améliorations, bugs, autres).
-- Le chemin critique est l'email admin (envoyé par /api/feedback-chat) ;
-- cette table est l'archive consultable. Le code tolère son absence
-- (insert best-effort) — appliquer quand même cette migration pour l'historique.
-- À COLLER DANS LE SQL EDITOR SUPABASE (pas d'exec_sql sur ce projet).

CREATE TABLE IF NOT EXISTS platform_feedback (
  id serial PRIMARY KEY,
  user_kind text NOT NULL DEFAULT 'inconnu' CHECK (user_kind IN ('particulier', 'pro', 'inconnu')),
  email text,
  category text NOT NULL DEFAULT 'autre' CHECK (category IN ('amelioration', 'bug', 'autre')),
  summary text NOT NULL,
  transcript jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'done')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table interne : RLS ON sans aucune policy = deny total anon/authenticated.
-- Les écritures passent par le service_role (API route) qui bypasse RLS.
-- Cf. leçon CLAUDE.md 22/05/2026.
ALTER TABLE platform_feedback ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_platform_feedback_status ON platform_feedback (status, created_at DESC);

NOTIFY pgrst, 'reload schema';
