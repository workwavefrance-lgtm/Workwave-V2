-- ============================================================================
-- Migration : Workwave AI — categories tech (Phase 4)
-- ============================================================================
-- Cree les 6 categories tech alignees avec la landing /ai et le formulaire
-- d'inscription. Idempotent via ON CONFLICT (slug) DO NOTHING.
--
-- Au seed initial (Phase 4) tous les pros tech vont en "developpement-web"
-- (categorie par defaut, la plus large). La re-categorisation precise
-- (IA, Cloud, Data, etc.) viendra via GitHub languages enrichment (Phase 4b).
--
-- Run :
--   psql $DATABASE_URL -f migrations/2026-05-25_workwave_ai_tech_categories.sql
-- ============================================================================

INSERT INTO categories (slug, name, vertical, description, seo_keywords)
VALUES
  (
    'developpement-web',
    'Developpement Web',
    'tech',
    'Freelances developpeurs full-stack, frontend, backend : React, Next.js, Vue, Node.js, Python, mobile, e-commerce.',
    ARRAY['developpeur web', 'freelance dev', 'react', 'nextjs', 'fullstack', 'backend', 'frontend']
  ),
  (
    'intelligence-artificielle',
    'Intelligence Artificielle',
    'tech',
    'Freelances IA : LLM, RAG, agents, fine-tuning, computer vision, integration ChatGPT/Claude/Gemini.',
    ARRAY['intelligence artificielle', 'freelance IA', 'LLM', 'RAG', 'agents IA', 'fine-tuning']
  ),
  (
    'cloud-devops',
    'Cloud & DevOps',
    'tech',
    'Freelances cloud et DevOps : AWS, GCP, Azure, Kubernetes, Docker, CI/CD, terraform, infrastructure as code.',
    ARRAY['cloud', 'devops', 'aws', 'gcp', 'azure', 'kubernetes', 'docker', 'terraform']
  ),
  (
    'no-code-automation',
    'No-Code & Automation',
    'tech',
    'Freelances no-code et automation : Bubble, Make, Zapier, Airtable, Webflow, n8n.',
    ARRAY['no-code', 'automation', 'bubble', 'make', 'zapier', 'webflow', 'airtable']
  ),
  (
    'data-analytics',
    'Data & Analytics',
    'tech',
    'Freelances data : Business Intelligence, ETL, ML engineering, data science, dashboards, data engineering.',
    ARRAY['data', 'analytics', 'BI', 'ETL', 'machine learning', 'data science', 'data engineering']
  ),
  (
    'design-produit',
    'Design Produit',
    'tech',
    'Freelances design produit : UX/UI, prototypage, design system, Figma, recherche utilisateur.',
    ARRAY['design produit', 'UX', 'UI', 'figma', 'prototypage', 'design system', 'recherche utilisateur']
  )
ON CONFLICT (slug) DO NOTHING;

-- Verification :
--   SELECT id, slug, name, vertical FROM categories WHERE vertical = 'tech' ORDER BY slug;
-- Attendu : 6 rows.
