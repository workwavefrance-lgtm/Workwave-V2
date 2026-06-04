-- Table prospects : entreprises trouvées sur Google Maps (hors base Sirene),
-- avec mobile, à recruter quand un projet tombe dans leur métier × département.
-- Source : moisson manuelle Google Maps (workwave-mobiles-harvest.csv), puis Apify à terme.
--
-- Modèle : ces entreprises n'ont PAS de fiche Workwave. On les contacte par SMS
-- pour qu'elles créent leur fiche (/pro/creer-fiche) et reçoivent les demandes.
-- => table séparée de `pros` (pas de pollution des listings/SEO).

create table if not exists public.prospects (
  id               bigserial primary key,
  name             text not null,
  category_slug    text not null,              -- 'couvreur', 'electricien', ...
  category_id      integer,                     -- résolu à l'import (lookup categories)
  city             text not null,               -- 'Bordeaux'
  department_code  text,                        -- '33'
  phone            text not null,               -- mobile normalisé 0XXXXXXXXX
  email            text,
  source           text not null default 'google_maps',
  created_at       timestamptz not null default now(),
  contacted_at     timestamptz,                 -- idempotence : NULL = jamais contacté
  contact_channel  text,                        -- 'sms' | 'email' | 'whatsapp'
  do_not_contact   boolean not null default false,  -- opt-out (STOP) / blacklist
  converted_pro_id bigint,                       -- si le prospect crée sa fiche → id pros
  notes            text
);

-- un numéro unique dans la table (idempotence des imports)
create unique index if not exists prospects_phone_key on public.prospects (phone);

-- requête de recrutement par projet : métier × département, non contactés
create index if not exists prospects_cat_dept_idx
  on public.prospects (category_slug, department_code);

-- RLS : table interne. Aucune policy = deny total pour anon/authenticated.
-- service_role (scripts, Server Actions, webhooks) bypasse toujours RLS.
alter table public.prospects enable row level security;
