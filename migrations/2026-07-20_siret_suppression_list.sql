-- ============================================================================
-- Liste d'exclusion — rendre un effacement RGPD DURABLE
-- ============================================================================
--
-- LE PROBLÈME : nos fiches viennent du répertoire public SIRENE. Quand une
-- personne exerce son droit à l'effacement (art. 17) et qu'on supprime sa
-- ligne, le prochain passage du scraper la RECRÉE à l'identique. La personne
-- se retrouve republiée après avoir obtenu sa suppression — pire que de
-- n'avoir rien fait, et cette fois avec une faute avérée.
--
-- LA SOLUTION HABITUELLE serait de garder la ligne en base comme pierre
-- tombale. Mais garder le nom et le SIRET de quelqu'un qui demande à
-- disparaître, c'est précisément ce qu'il ne veut pas.
--
-- CE QU'ON FAIT : on stocke une EMPREINTE (SHA-256) du numéro, jamais le
-- numéro lui-même. Le scraper hache chaque SIRET rencontré et compare. Une
-- empreinte ne permet pas de retrouver la personne ni de reconstituer son
-- numéro ; elle permet seulement de reconnaître le même identifiant s'il se
-- représente. On honore l'opposition dans la durée sans conserver de donnée
-- lisible — c'est la conservation minimale strictement nécessaire.

create table if not exists public.siret_suppression_list (
  -- SHA-256 hexadécimal du SIRET (14 chiffres) ou du numéro BCE (10 chiffres),
  -- toujours normalisé : chiffres uniquement, sans espace ni point.
  identifier_hash text primary key,

  -- Motif, sans aucune donnée nominative.
  reason          text not null default 'rgpd_erasure',

  -- Date de la demande, utile en cas de contrôle.
  created_at      timestamptz not null default now()
);

comment on table public.siret_suppression_list is
  'Empreintes des identifiants d''entreprise dont le titulaire a demandé l''effacement. Consultée par le scraper SIRENE/BCE avant toute insertion. Ne contient aucune donnée nominative ni aucun numéro en clair.';

-- RLS stricte, aucune policy : inaccessible au public, lisible uniquement
-- côté serveur (service_role, qui contourne toujours RLS).
alter table public.siret_suppression_list enable row level security;

notify pgrst, 'reload schema';
