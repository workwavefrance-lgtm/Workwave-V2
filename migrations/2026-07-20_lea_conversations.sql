-- ============================================================================
-- Journal des conversations de Léa — visibilité sur ce que l'IA raconte
-- ============================================================================
--
-- POURQUOI : Léa parle au nom de Workwave à des inconnus, sans relecture
-- humaine, et ses conversations ne laissaient AUCUNE trace (elles vivaient
-- dans l'onglet du visiteur puis disparaissaient). Seules celles finissant en
-- ticket étaient visibles. Un dérapage sur une conversation non escaladée
-- n'aurait donc jamais été découvert.
--
-- CE QU'ON N'ENREGISTRE PAS : la totalité des échanges. 95 % sont des « bonjour
-- je cherche un plombier » sans intérêt, et les stocker reviendrait à
-- accumuler des données personnelles de particuliers sans raison. On ne garde
-- que ce qui mérite un œil humain (voir la colonne `flags`).
--
-- RGPD : ces lignes contiennent ce que le visiteur a tapé, donc potentiellement
-- des données personnelles. Conservation limitée à 90 jours, purge par
-- scripts/purge-lea-conversations.ts. Table en RLS stricte, aucune policy :
-- inaccessible au rôle anon, lisible uniquement côté serveur (service_role).

create table if not exists public.lea_conversations (
  id              bigserial primary key,

  -- Identifiant de conversation généré par le navigateur (sessionStorage).
  -- Une conversation = une ligne, mise à jour au fil des échanges.
  conversation_id text not null,

  -- Motifs de mise sous surveillance. Plusieurs peuvent s'appliquer.
  --   juridique     : CNIL, avocat, plainte, mise en demeure, tribunal
  --   remboursement : demande de remboursement, accusation d'arnaque
  --   colere        : insultes, menaces, ton agressif
  --   donnees       : demande de coordonnées d'un tiers ou du dirigeant
  --   refus         : Léa a refusé ou déclaré ne pas pouvoir faire
  --   escalade      : un ticket a été ouvert depuis cette conversation
  --   echantillon   : tirage aléatoire, pour contrôler aussi le fonctionnement
  --                   NORMAL et pas seulement les incidents
  flags           text[] not null default '{}',

  -- Page depuis laquelle le visiteur écrivait.
  pathname        text,

  -- Fil complet, borné. Rôles réécrits (VISITEUR / LÉA) à l'écriture.
  transcript      text not null,

  message_count   int not null default 0,

  -- Ticket éventuellement ouvert depuis cette conversation.
  ticket_id       bigint references public.support_tickets(id) on delete set null,

  -- Marqué comme relu par l'admin (pour ne pas repasser deux fois dessus).
  reviewed_at     timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Une seule ligne par conversation : les échanges suivants la mettent à jour.
create unique index if not exists idx_lea_conversations_conv
  on public.lea_conversations (conversation_id);

-- Listing admin : les plus récentes d'abord, non relues en priorité.
create index if not exists idx_lea_conversations_created
  on public.lea_conversations (created_at desc);

create index if not exists idx_lea_conversations_todo
  on public.lea_conversations (created_at desc) where reviewed_at is null;

-- Recherche par motif (« montre-moi tout ce qui touche au juridique »).
create index if not exists idx_lea_conversations_flags
  on public.lea_conversations using gin (flags);

-- updated_at automatique
create or replace function public.touch_lea_conversations()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_lea_conversations on public.lea_conversations;
create trigger trg_touch_lea_conversations
  before update on public.lea_conversations
  for each row execute function public.touch_lea_conversations();

-- RLS stricte : aucune policy = refus total pour anon et authenticated.
-- Le rôle service_role (serveur, scripts) contourne toujours RLS.
alter table public.lea_conversations enable row level security;

notify pgrst, 'reload schema';
