-- Ajoute la colonne pros.alt_emails pour stocker TOUS les emails trouves
-- lors du crawl (pas juste l'email principal qui va dans pros.email).
--
-- Usage : ['contact@xyz.fr', 'info@xyz.fr', 'devis@xyz.fr']
--
-- Permet de garder une "reserve" d'emails pour les cas ou l'email principal
-- bounce, ou pour cibler differents departements (commercial vs SAV vs
-- comptabilite) lors de futures campagnes.

ALTER TABLE public.pros
  ADD COLUMN IF NOT EXISTS alt_emails JSONB DEFAULT '[]'::jsonb;

-- Index GIN pour pouvoir chercher dans le tableau JSON
CREATE INDEX IF NOT EXISTS idx_pros_alt_emails_gin
  ON public.pros USING GIN (alt_emails);

COMMENT ON COLUMN public.pros.alt_emails IS
  'Liste de TOUS les emails trouves sur le site web du pro lors du crawl (en plus de pros.email). Ex: ["info@xxx.fr", "devis@xxx.fr"]. Reserve pour campagnes ciblees futures.';
