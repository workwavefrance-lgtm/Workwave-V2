-- =====================================================================
-- Support maison — Phase 1 : tickets + messages (boîte de réception unique)
-- =====================================================================
-- Objectif : transformer chaque demande (email contact@, chat Léa escaladé,
-- formulaire) en TICKET traçable, relié à la data existante (pro, projet).
--
-- Robustesse / échelle (exigence 1 -> 1 000 000 clients) :
--   - index sur TOUTES les colonnes filtrées (status, email, pro, projet,
--     token, thread) => listing et lookups restent rapides à gros volume ;
--   - RLS stricte : anon = deny total ; un pro (authenticated) ne voit QUE
--     ses tickets et leurs messages PUBLICS ; service_role (admin/crons/
--     webhooks) bypasse tout ;
--   - idempotence de la création côté code (thread par email/Message-ID) ;
--   - audit-trail des notifs admin (admin_notified_at / _error) => jamais de
--     perte silencieuse.
--
-- FK : pros.id et projects.id sont en SERIAL (integer) -> pro_id/project_id
-- en integer. PK des tables support en bigint identity (indépendant).
-- =====================================================================

-- ---------- Table : tickets ----------
create table if not exists public.support_tickets (
  id                       bigint generated always as identity primary key,
  source                   text not null default 'email'
                             check (source in ('email', 'chat', 'form', 'admin')),
  status                   text not null default 'open'
                             check (status in ('open', 'pending', 'resolved', 'closed')),
  subject                  text,
  requester_email          text,
  requester_name           text,
  pro_id                   integer references public.pros(id) on delete set null,
  project_id               integer references public.projects(id) on delete set null,
  user_id                  uuid,           -- auth.uid() si pro connecté
  category                 text,           -- tri IA : rgpd|unlock|claim|facturation|projet|autre
  priority                 text not null default 'normal'
                             check (priority in ('normal', 'urgent')),
  is_legal                 boolean not null default false,  -- flag CNIL/avocat
  access_token             text,           -- magic-link particulier sans compte (Phase 2)
  last_message_at          timestamptz not null default now(),
  admin_notified_at        timestamptz,
  admin_notification_error text,
  first_response_at        timestamptz,
  resolved_at              timestamptz,
  closed_at                timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- ---------- Table : messages ----------
create table if not exists public.support_messages (
  id               bigint generated always as identity primary key,
  ticket_id        bigint not null references public.support_tickets(id) on delete cascade,
  author_role      text not null check (author_role in ('client', 'pro', 'agent', 'ai', 'system')),
  body             text not null,
  is_internal      boolean not null default false,  -- note interne (agents) vs message public
  email_message_id text,                            -- threading email (Message-ID / In-Reply-To)
  created_at       timestamptz not null default now()
);

-- ---------- Index (échelle) ----------
create index if not exists idx_support_tickets_status_last
  on public.support_tickets (status, last_message_at desc);
create index if not exists idx_support_tickets_created
  on public.support_tickets (created_at desc);
create index if not exists idx_support_tickets_email
  on public.support_tickets (requester_email);
create index if not exists idx_support_tickets_pro
  on public.support_tickets (pro_id) where pro_id is not null;
create index if not exists idx_support_tickets_project
  on public.support_tickets (project_id) where project_id is not null;
create unique index if not exists idx_support_tickets_access_token
  on public.support_tickets (access_token) where access_token is not null;
create index if not exists idx_support_tickets_notif_todo
  on public.support_tickets (created_at) where admin_notified_at is null;

create index if not exists idx_support_messages_ticket
  on public.support_messages (ticket_id, created_at);
-- UNIQUE (partiel) : idempotence au niveau base — un même email entrant
-- (identifié par son id Resend) ne peut jamais créer 2 messages, même si le
-- webhook est rejoué. Le code catch l'erreur 23505 et repart proprement.
create unique index if not exists idx_support_messages_email_mid
  on public.support_messages (email_message_id) where email_message_id is not null;

-- ---------- updated_at auto ----------
create or replace function public.support_tickets_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_support_tickets_updated_at on public.support_tickets;
create trigger trg_support_tickets_updated_at
  before update on public.support_tickets
  for each row execute function public.support_tickets_touch_updated_at();

-- ---------- Recherche admin (trigram GIN) ----------
-- pg_trgm déjà installé (migr. 2026-06-04). Table neuve -> build instantané.
-- Rend les ILIKE '%x%' de la recherche admin index-usables (pas de seq scan).
create index if not exists idx_support_tickets_subject_trgm
  on public.support_tickets using gin (subject gin_trgm_ops);
create index if not exists idx_support_tickets_email_trgm
  on public.support_tickets using gin (requester_email gin_trgm_ops);
create index if not exists idx_support_tickets_name_trgm
  on public.support_tickets using gin (requester_name gin_trgm_ops);

-- ---------- Jointure de contexte par email (pros / projects) ----------
-- Le helper d'ingestion relie un ticket à un pro/projet par match EXACT d'email
-- (.eq, JAMAIS ilike : les '_' / '%' d'un email sont des jokers LIKE = mauvais
-- match + fuite PII). Sans index, un .eq sur pros(email) (~2,5M lignes) = seq
-- scan à CHAQUE email entrant = DoS. Un btree simple suffit pour l'égalité.
-- NB : CREATE INDEX pose un verrou d'écriture BREF sur pros -> lancer hors pic
-- de scraping (quelques secondes sur 2,5M lignes).
create index if not exists idx_pros_email on public.pros (email);
create index if not exists idx_projects_email on public.projects (email);

-- ---------- RLS ----------
-- service_role (admin, crons, webhooks -> getServiceClient) bypasse TOUJOURS.
-- Phase 1 : AUCUNE policy pour anon/authenticated => DENY TOTAL. Les tickets ne
-- sont lus/écrits QUE côté admin (service_role). L'accès côté PRO (dashboard)
-- viendra en Phase 2 avec un scope PROUVÉ (user_id = auth.uid(), pas l'heuristique
-- pro_id qui, sur une simple collision d'email, donnerait accès aux PII d'un
-- tiers) + une protection au niveau COLONNE (ne jamais exposer access_token /
-- is_legal / category via une policy row-level).
alter table public.support_tickets  enable row level security;
alter table public.support_messages enable row level security;

-- Recharge le cache de schéma PostgREST (sinon "column not found" sur les
-- colonnes fraîchement créées).
notify pgrst, 'reload schema';
