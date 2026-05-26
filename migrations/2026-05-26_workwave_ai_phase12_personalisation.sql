-- Migration : personnalisation freelances Workwave AI (Phase 12)
-- Date : 2026-05-26
--
-- Permet a chaque freelance de personnaliser :
--   - avatar_color : couleur du cercle d'initiales (palette 8 couleurs)
--   - theme_color : couleur d'accent appliquee a sa fiche publique
--
-- Pas d'upload photo pour l'instant (necessiterait Supabase Storage
-- bucket public + signed URLs + retraitement image). On reste sur
-- "initiales sur gradient" qui est :
--   - 0 latence (pas de fetch image)
--   - 0 storage cost
--   - 100% Pixel Rise vibe (style minimal premium)
--
-- Palette autorisee (8 couleurs cool/fun) :
--   - orange (default, brand) : #FF6803
--   - blue    : #2563EB
--   - purple  : #7C3AED
--   - green   : #16A34A
--   - pink    : #EC4899
--   - red     : #DC2626
--   - yellow  : #EAB308
--   - cyan    : #06B6D4
--
-- Le check constraint cote BDD verifie qu'on a bien une des 8 valeurs.

ALTER TABLE pros
  ADD COLUMN IF NOT EXISTS avatar_color text,
  ADD COLUMN IF NOT EXISTS theme_color text;

-- Check constraints (idempotent : skip si deja la)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pros_avatar_color_check'
  ) THEN
    ALTER TABLE pros
      ADD CONSTRAINT pros_avatar_color_check
      CHECK (avatar_color IS NULL OR avatar_color IN (
        'orange', 'blue', 'purple', 'green', 'pink', 'red', 'yellow', 'cyan'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pros_theme_color_check'
  ) THEN
    ALTER TABLE pros
      ADD CONSTRAINT pros_theme_color_check
      CHECK (theme_color IS NULL OR theme_color IN (
        'orange', 'blue', 'purple', 'green', 'pink', 'red', 'yellow', 'cyan'
      ));
  END IF;
END $$;

COMMENT ON COLUMN pros.avatar_color IS
  'Couleur du cercle d''initiales (palette Workwave AI Phase 12). NULL = orange par defaut.';

COMMENT ON COLUMN pros.theme_color IS
  'Couleur d''accent appliquee a la fiche publique du freelance (Phase 12). NULL = orange par defaut.';
