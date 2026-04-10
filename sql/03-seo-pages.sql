-- ============================================
-- Workwave V2 — Sprint 3 : Table seo_pages
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- Table contenu SEO généré par IA
CREATE TABLE seo_pages (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug            TEXT        NOT NULL UNIQUE,
  type            TEXT        NOT NULL CHECK (type IN ('metier_ville', 'metier_dept')),
  category_id     BIGINT      NOT NULL REFERENCES categories(id),
  city_id         BIGINT      REFERENCES cities(id),
  department_id   BIGINT      REFERENCES departments(id),
  title           TEXT        NOT NULL,
  meta_description TEXT       NOT NULL,
  content         TEXT        NOT NULL,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les lookups rapides
CREATE INDEX idx_seo_pages_category    ON seo_pages(category_id);
CREATE INDEX idx_seo_pages_city        ON seo_pages(city_id);
CREATE INDEX idx_seo_pages_department  ON seo_pages(department_id);
CREATE INDEX idx_seo_pages_type        ON seo_pages(type);

-- Contrainte : une seule page SEO par combinaison catégorie + ville/département
CREATE UNIQUE INDEX idx_seo_pages_cat_city ON seo_pages(category_id, city_id) WHERE city_id IS NOT NULL;
CREATE UNIQUE INDEX idx_seo_pages_cat_dept ON seo_pages(category_id, department_id) WHERE department_id IS NOT NULL AND city_id IS NULL;

-- RLS : lecture publique
ALTER TABLE seo_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo_pages_public_read" ON seo_pages FOR SELECT USING (true);
