-- ════════════════════════════════════════════════════════════════════════
-- BTP — Moteur "guides des prix" (réplication travaux.com).
-- Table dédiée price_guides : guides PRIX national par métier (/[metier]/prix)
-- et par prestation (/guide-des-prix/[slug]). Distincte de seo_guides (qui sont
-- des guides "métier/carrière") et de blog_posts.
--
-- PRIX = sourcés (Perplexity, cités) — jamais inventés. price_sources garde les
-- URLs sources + price_retrieved_at la date.
--
-- RLS activée dès la création (leçon 22/05) : lecture publique des guides
-- 'published' uniquement ; écriture réservée à service_role (scripts/cron).
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS price_guides (
  id               bigserial PRIMARY KEY,
  slug             text NOT NULL UNIQUE,
  scope            text NOT NULL DEFAULT 'prestation' CHECK (scope IN ('metier', 'prestation')),
  metier_slug      text,                      -- rattachement pour le maillage (null si guide "flat")
  univers          text,                      -- taxonomie de regroupement (hub)
  title            text NOT NULL,             -- <title>
  h1               text NOT NULL,
  meta_description text,
  intro_md         text,                      -- prose unique (markdown)
  price_ranges     jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{label, low, high, unit}]
  price_sources    jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [url, ...]
  price_retrieved_at date,
  factors_md       text,                      -- facteurs de variation (markdown)
  devis_examples   jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{label, total, detail}]
  faq              jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{q, a}]
  related_slugs    jsonb NOT NULL DEFAULT '[]'::jsonb,  -- maillage guides connexes
  volume_est       integer,
  kd               integer,
  status           text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  source_blog_slug text,                      -- si migré depuis un article blog (301)
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_guides_scope_metier ON price_guides (scope, metier_slug);
CREATE INDEX IF NOT EXISTS idx_price_guides_status ON price_guides (status);
CREATE INDEX IF NOT EXISTS idx_price_guides_univers ON price_guides (univers);

-- updated_at auto
CREATE OR REPLACE FUNCTION set_price_guides_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_price_guides_updated_at ON price_guides;
CREATE TRIGGER trg_price_guides_updated_at BEFORE UPDATE ON price_guides
  FOR EACH ROW EXECUTE FUNCTION set_price_guides_updated_at();

-- RLS : lecture publique des guides publiés uniquement
ALTER TABLE price_guides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS price_guides_select_published ON price_guides;
CREATE POLICY price_guides_select_published ON price_guides
  FOR SELECT USING (status = 'published');
-- Pas de policy INSERT/UPDATE/DELETE : seul service_role écrit (il bypass RLS).
