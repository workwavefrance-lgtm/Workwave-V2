-- Ajoute la colonne pros.description_ai pour les descriptions enrichies par IA
-- (fallback quand le pro n'a pas de description manuelle).
--
-- Objectif SEO : transformer les fiches squelettes Sirene (nom + ville + SIRET)
-- en pages enrichies pour debloquer l'indexation Google (les 3 384 "Explorees
-- actuellement non indexees" dans GSC).
--
-- Pattern : la page /artisan/[slug] utilise pros.description (manual) en
-- priorite, et pros.description_ai en fallback. Si le pro reclame sa fiche
-- et ecrit sa propre description, pros.description prend le dessus.

ALTER TABLE public.pros
  ADD COLUMN IF NOT EXISTS description_ai TEXT;

COMMENT ON COLUMN public.pros.description_ai IS
  'Description generee par IA (Claude) pour enrichir les pages thin content. Fallback si pros.description manuelle est NULL/vide.';

-- Pas d'index : la colonne est juste lue pour affichage, pas filtree.
