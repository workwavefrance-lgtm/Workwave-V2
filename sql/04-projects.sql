-- Sprint 4 : Table des projets déposés par les particuliers
-- À exécuter dans Supabase SQL Editor

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  city_id INTEGER NOT NULL REFERENCES cities(id),
  description TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('today', 'this_week', 'this_month', 'not_urgent')),
  budget TEXT NOT NULL CHECK (budget IN ('lt500', '500_2000', '2000_5000', '5000_15000', 'gt15000', 'unknown')),
  ai_qualification JSONB DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'routed', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS : insertion publique (formulaire), lecture réservée aux admins
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permettre l'insertion publique de projets"
  ON projects
  FOR INSERT
  WITH CHECK (true);

-- Index pour les requêtes admin courantes
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_category_id ON projects(category_id);
