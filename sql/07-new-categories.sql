-- ============================================
-- Workwave V2 — Migration 07 : 7 nouvelles catégories
-- ============================================
-- Objectif : combler les gaps SEO identifiés dans l'audit concurrentiel
-- (cf. docs/seo-audit-concurrents.md + données mots-clés réels Travaux.com).
--
-- Volume mensuel total estimé sur ces 7 catégories : ~78 000 recherches/mois
-- (pisciniste seul = 45 500, le reste réparti).
--
-- À exécuter dans l'éditeur SQL de Supabase Studio.
-- ============================================

BEGIN;

-- 1. Pisciniste (BTP) — 45 500 vol/mois — 0 concurrent dans la Vienne
--    Mots-clés : "pisciniste", "construction piscine", "piscine sur mesure",
--    "piscine béton", "piscine coque", "pisciniste près de moi"
INSERT INTO categories (slug, name, vertical, naf_codes, description, seo_keywords)
VALUES (
  'pisciniste',
  'Pisciniste',
  'btp',
  ARRAY['4329B', '4399A'],  -- Autres travaux d'installation n.c.a. + Travaux d'étanchéité
  'Construction, installation et entretien de piscines : coque, béton, monobloc, hors-sol. Devis gratuit.',
  ARRAY[
    'pisciniste', 'construction piscine', 'piscine sur mesure',
    'piscine béton', 'piscine coque', 'piscine monobloc',
    'pisciniste près de moi', 'installateur piscine',
    'piscine enterrée', 'pisciniste agréé'
  ]
);

-- 2. Vitrier (BTP) — ~10 000 vol/mois — urgences fortes (24h)
--    Mots-clés : "vitrier", "vitrier urgence", "remplacement vitre",
--    "vitrier 24h", "vitrerie"
INSERT INTO categories (slug, name, vertical, naf_codes, description, seo_keywords)
VALUES (
  'vitrier',
  'Vitrier',
  'btp',
  ARRAY['4334Z', '4332B'],  -- Travaux de peinture et vitrerie + Menuiserie métallique
  'Pose et remplacement de vitres : double vitrage, miroirs, vérandas, urgences 24h/24.',
  ARRAY[
    'vitrier', 'vitrier urgence', 'remplacement vitre',
    'vitrier 24h', 'vitrerie', 'vitre cassée',
    'double vitrage', 'miroitier', 'vitrier près de moi',
    'pose de vitres'
  ]
);

-- 3. Ramoneur (BTP) — ~5 000 vol/mois — saisonnier (oct-mars)
--    Obligation légale annuelle : marché captif récurrent.
--    Mots-clés : "ramoneur", "ramonage cheminée", "ramonage poêle",
--    "ramoneur agréé"
INSERT INTO categories (slug, name, vertical, naf_codes, description, seo_keywords)
VALUES (
  'ramoneur',
  'Ramoneur',
  'btp',
  ARRAY['8129B', '4322B'],  -- Autres activités de nettoyage + Installation thermique
  'Ramonage de cheminée, poêle à bois, poêle à granulés et conduits de fumée. Certificat fourni.',
  ARRAY[
    'ramoneur', 'ramonage cheminée', 'ramonage poêle',
    'ramoneur agréé', 'ramonage obligatoire', 'ramoneur près de moi',
    'certificat ramonage', 'ramonage chaudière',
    'fumiste', 'entretien cheminée'
  ]
);

-- 4. Installateur vidéosurveillance / alarme (BTP) — ~8 000 vol/mois
--    Mots-clés : "installateur alarme", "vidéosurveillance maison",
--    "caméra surveillance", "alarme maison"
INSERT INTO categories (slug, name, vertical, naf_codes, description, seo_keywords)
VALUES (
  'videosurveillance-installateur',
  'Installateur vidéosurveillance',
  'btp',
  ARRAY['8020Z', '4321A'],  -- Activités liées aux systèmes de sécurité + Installation électrique
  'Installation de systèmes d''alarme, caméras de surveillance, contrôle d''accès et télésurveillance.',
  ARRAY[
    'installateur alarme', 'vidéosurveillance maison',
    'caméra surveillance', 'alarme maison',
    'installation alarme', 'télésurveillance',
    'caméra extérieure', 'alarme connectée',
    'installateur sécurité', 'vidéosurveillance entreprise'
  ]
);

-- 5. Entreprise de nettoyage pro (Domicile, segment B2B) — ~4 000 vol/mois
--    Distinct de "menage" qui cible le particulier (chèque emploi service).
--    Mots-clés : "entreprise de nettoyage", "société de nettoyage bureaux",
--    "nettoyage industriel"
INSERT INTO categories (slug, name, vertical, naf_codes, description, seo_keywords)
VALUES (
  'nettoyage-pro',
  'Entreprise de nettoyage',
  'domicile',
  ARRAY['8121Z', '8129A'],  -- Nettoyage courant des bâtiments + Désinfection
  'Nettoyage professionnel pour bureaux, commerces, copropriétés, entreprises et collectivités.',
  ARRAY[
    'entreprise de nettoyage', 'société de nettoyage',
    'nettoyage bureaux', 'nettoyage industriel',
    'nettoyage commerces', 'nettoyage copropriété',
    'société de propreté', 'agent d''entretien',
    'nettoyage fin de chantier', 'nettoyage entreprise'
  ]
);

-- 6. Cuisiniste (BTP) — ~6 000 vol/mois — secteur très commercial
--    Mots-clés : "cuisiniste", "cuisine sur mesure", "aménagement cuisine",
--    "cuisine équipée"
INSERT INTO categories (slug, name, vertical, naf_codes, description, seo_keywords)
VALUES (
  'cuisiniste',
  'Cuisiniste',
  'btp',
  ARRAY['4332A', '4759B'],  -- Menuiserie bois et PVC + Commerce détail équipements foyer
  'Conception, vente et installation de cuisines équipées sur mesure. Visite à domicile gratuite.',
  ARRAY[
    'cuisiniste', 'cuisine sur mesure', 'aménagement cuisine',
    'cuisine équipée', 'pose cuisine', 'cuisine moderne',
    'cuisine ouverte', 'îlot central', 'cuisiniste près de moi',
    'cuisine américaine'
  ]
);

-- 7. Cheministe / installateur poêle (BTP) — ~5 000 vol/mois
--    Lié à la transition énergétique (MaPrimeRénov' poêle granulés).
--    Mots-clés : "installateur poêle", "poêle à granulés",
--    "poêle à bois", "cheministe"
INSERT INTO categories (slug, name, vertical, naf_codes, description, seo_keywords)
VALUES (
  'cheministe',
  'Cheministe',
  'btp',
  ARRAY['4322B', '4391B'],  -- Installation thermique + Travaux de couverture
  'Installation de cheminées, poêles à bois, poêles à granulés et inserts. Certifié RGE Qualibois.',
  ARRAY[
    'cheministe', 'installateur poêle',
    'poêle à granulés', 'poêle à bois',
    'cheminée installation', 'foyer fermé',
    'insert cheminée', 'poêle pellets',
    'qualibois', 'installateur cheminée'
  ]
);

COMMIT;

-- ============================================
-- VÉRIFICATION (à exécuter après commit)
-- ============================================
-- SELECT COUNT(*) AS total FROM categories;
-- -- Attendu : 35 (existantes) + 7 = 42
--
-- SELECT slug, name, vertical, naf_codes
-- FROM categories
-- WHERE slug IN ('pisciniste', 'vitrier', 'ramoneur',
--                'videosurveillance-installateur', 'nettoyage-pro',
--                'cuisiniste', 'cheministe')
-- ORDER BY slug;
-- -- Attendu : 7 lignes
--
-- ============================================
-- ÉTAPE SUIVANTE : re-scraping Sirene
-- ============================================
-- Après cette migration, relancer scripts/scraping/sirene_vienne.py
-- avec les nouveaux codes NAF pour peupler ces 7 catégories en pros
-- pour la Vienne (86). Voir CLAUDE.md section 9 (mini-sprint scraping).
--
-- Volume attendu après scraping :
--   - pisciniste : ~30-50 pros (Vienne)
--   - vitrier : ~50-80 pros
--   - ramoneur : ~20-30 pros
--   - vidéosurveillance : ~15-25 pros
--   - nettoyage-pro : ~80-120 pros
--   - cuisiniste : ~20-40 pros
--   - cheministe : ~15-25 pros
-- Total estimé : +250 à +400 pros pour la Vienne.
