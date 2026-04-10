-- ============================================
-- Workwave V2 — Sprint 1 : Données de référence
-- À exécuter APRÈS 01-schema.sql
-- ============================================

-- Département Vienne
INSERT INTO departments (code, name, region) VALUES
  ('86', 'Vienne', 'Nouvelle-Aquitaine');

-- Catégories BTP (18)
INSERT INTO categories (slug, name, vertical, naf_codes) VALUES
  ('plombier',              'Plombier',              'btp', ARRAY['4322A']),
  ('electricien',           'Électricien',           'btp', ARRAY['4321A','4321B']),
  ('macon',                 'Maçon',                 'btp', ARRAY['4399C']),
  ('peintre',               'Peintre',               'btp', ARRAY['4334Z']),
  ('menuisier',             'Menuisier',             'btp', ARRAY['4332A','4332B']),
  ('carreleur',             'Carreleur',             'btp', ARRAY['4333Z']),
  ('plaquiste',             'Plaquiste',             'btp', ARRAY['4331Z']),
  ('couvreur',              'Couvreur',              'btp', ARRAY['4391B']),
  ('charpentier',           'Charpentier',           'btp', ARRAY['4391A']),
  ('facadier',              'Façadier',              'btp', ARRAY['4399A']),
  ('serrurier',             'Serrurier',             'btp', ARRAY['4332B']),
  ('chauffagiste',          'Chauffagiste',          'btp', ARRAY['4322B']),
  ('climaticien',           'Climaticien',           'btp', ARRAY['4322B']),
  ('terrassier',            'Terrassier',            'btp', ARRAY['4312A']),
  ('paysagiste',            'Paysagiste',            'btp', ARRAY['8130Z']),
  ('elagueur',              'Élagueur',              'btp', ARRAY['0210Z']),
  ('architecte',            'Architecte',            'btp', ARRAY['7111Z']),
  ('decorateur-interieur',  'Décorateur intérieur',  'btp', ARRAY['7410Z']);

-- Catégories Services à domicile (9)
INSERT INTO categories (slug, name, vertical, naf_codes) VALUES
  ('menage',                    'Ménage',                    'domicile', ARRAY['8121Z']),
  ('repassage',                 'Repassage',                 'domicile', ARRAY['9601A']),
  ('jardinage',                 'Jardinage',                 'domicile', ARRAY['8130Z']),
  ('petit-bricolage',           'Petit bricolage',           'domicile', ARRAY['4339Z']),
  ('nettoyage-vitres',          'Nettoyage vitres',          'domicile', ARRAY['8122Z']),
  ('debarras',                  'Débarras',                  'domicile', ARRAY['3832Z']),
  ('demenagement',              'Déménagement',              'domicile', ARRAY['4942Z']),
  ('livraison-de-courses',      'Livraison de courses',      'domicile', ARRAY['5320Z']),
  ('lavage-voiture-a-domicile', 'Lavage voiture à domicile', 'domicile', ARRAY['4520A']);

-- Catégories Aide à la personne (8)
INSERT INTO categories (slug, name, vertical, naf_codes) VALUES
  ('garde-enfants',             'Garde d''enfants',          'personne', ARRAY['8891A']),
  ('soutien-scolaire',          'Soutien scolaire',          'personne', ARRAY['8559A']),
  ('aide-seniors',              'Aide aux seniors',          'personne', ARRAY['8810A']),
  ('aide-administrative',       'Aide administrative',       'personne', ARRAY['8899B']),
  ('cours-particuliers',        'Cours particuliers',        'personne', ARRAY['8559B']),
  ('accompagnement-handicap',   'Accompagnement handicap',   'personne', ARRAY['8810C']),
  ('promenade-animaux',         'Promenade animaux',         'personne', ARRAY['9609Z']),
  ('garde-animaux',             'Garde animaux',             'personne', ARRAY['9609Z']);
