-- ============================================================================
-- Migration : Workwave AI — table ai_seo_content
-- ============================================================================
-- Stocke le contenu UNIQUE genere par Claude pour chaque page SEO
-- programmatic (skill x ville). Evite le thin content / duplicate content.
--
-- Structure :
--   - category_id : ref vers categories (skill ou macro tech)
--   - city_slug   : nullable. Si NULL, contenu pour la page nationale du skill
--                   (/ai/{skill}). Sinon (/ai/{skill}/{ville}).
--   - intro_html  : 300-500 mots de contenu unique (intro + contexte local)
--   - faq         : 4-6 Q/A specifiques (jsonb)
--   - stats       : chiffres uniques (jsonb : tjm_min, tjm_median, tjm_max,
--                   total_freelances, croissance_yoy, etc.)
--   - generated_at: timestamp generation Claude
--
-- Run : Supabase Dashboard SQL Editor
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_seo_content (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  city_slug TEXT, -- NULL = page nationale du skill
  intro_html TEXT NOT NULL,
  faq JSONB NOT NULL DEFAULT '[]'::jsonb,
  stats JSONB DEFAULT '{}'::jsonb,
  meta_title TEXT,
  meta_description TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  model_used TEXT DEFAULT 'claude-sonnet-4-6',
  UNIQUE(category_id, city_slug)
);

CREATE INDEX IF NOT EXISTS ai_seo_content_lookup_idx
  ON ai_seo_content(category_id, city_slug);

-- RLS active + policy lecture publique (pages affichent ce contenu)
ALTER TABLE ai_seo_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_seo_content_read_anon" ON ai_seo_content;
CREATE POLICY "ai_seo_content_read_anon" ON ai_seo_content
  FOR SELECT TO anon
  USING (true);

-- service_role bypass RLS, donc le seed/script generation marche
