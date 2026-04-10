-- ============================================
-- Workwave V2 — Sprint 1 : Schéma de base
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- Table départements
CREATE TABLE departments (
  id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code    VARCHAR(3)  NOT NULL UNIQUE,
  name    TEXT        NOT NULL,
  region  TEXT        NOT NULL
);

-- Table catégories de métiers
CREATE TABLE categories (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug          TEXT        NOT NULL UNIQUE,
  name          TEXT        NOT NULL,
  vertical      TEXT        NOT NULL CHECK (vertical IN ('btp', 'domicile', 'personne')),
  parent_id     BIGINT      REFERENCES categories(id),
  description   TEXT,
  seo_keywords  TEXT[],
  naf_codes     TEXT[]      NOT NULL DEFAULT '{}'
);

-- Table communes
CREATE TABLE cities (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  department_id   BIGINT          NOT NULL REFERENCES departments(id),
  name            TEXT            NOT NULL,
  slug            TEXT            NOT NULL,
  postal_code     TEXT,
  insee_code      VARCHAR(5),
  population      INTEGER,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  UNIQUE(slug, department_id)
);

-- Table professionnels
CREATE TABLE pros (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug                TEXT        NOT NULL UNIQUE,
  name                TEXT        NOT NULL,
  siret               VARCHAR(14) UNIQUE,
  siren               VARCHAR(9),
  category_id         BIGINT      NOT NULL REFERENCES categories(id),
  address             TEXT,
  city_id             BIGINT      REFERENCES cities(id),
  postal_code         VARCHAR(5),
  phone               TEXT,
  email               TEXT,
  website             TEXT,
  description         TEXT,
  logo_url            TEXT,
  photos              JSONB       DEFAULT '[]'::jsonb,
  claimed_by_user_id  UUID,
  is_subscribed       BOOLEAN     NOT NULL DEFAULT false,
  stripe_customer_id  TEXT,
  source              TEXT        NOT NULL CHECK (source IN ('sirene', 'pagesjaunes', 'manual')),
  naf_code            VARCHAR(6),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Index
-- ============================================

CREATE INDEX idx_categories_vertical   ON categories(vertical);
CREATE INDEX idx_categories_slug       ON categories(slug);
CREATE INDEX idx_cities_dept           ON cities(department_id);
CREATE INDEX idx_cities_insee          ON cities(insee_code);
CREATE INDEX idx_pros_category         ON pros(category_id);
CREATE INDEX idx_pros_city             ON pros(city_id);
CREATE INDEX idx_pros_postal_code      ON pros(postal_code);
CREATE INDEX idx_pros_source           ON pros(source);

-- ============================================
-- Trigger updated_at sur pros
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON pros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Row Level Security (lecture publique)
-- ============================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pros        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "departments_public_read" ON departments FOR SELECT USING (true);
CREATE POLICY "categories_public_read"  ON categories  FOR SELECT USING (true);
CREATE POLICY "cities_public_read"      ON cities      FOR SELECT USING (true);
CREATE POLICY "pros_public_read"        ON pros        FOR SELECT USING (true);
