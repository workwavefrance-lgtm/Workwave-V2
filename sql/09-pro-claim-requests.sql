-- À appliquer AVANT le code de validation manuelle. Aucune fiche historique modifiée.
begin;

alter table public.claim_attempts add column if not exists target_pro_id bigint references public.pros(id) on delete set null;

-- Le hash est effacé après usage : l'expiration identifie durablement une
-- émission, y compris après validation, blocage ou échec du prestataire email.
create index if not exists claim_attempts_claim_email_emissions
  on public.claim_attempts ((lower(btrim(email))), created_at desc)
  where type = 'claim' and code_expires_at is not null;
create index if not exists claim_attempts_claim_ip_emissions
  on public.claim_attempts ((lower(btrim(ip))), created_at desc)
  where type = 'claim' and code_expires_at is not null;

create or replace function public.limit_pro_claim_code_emissions()
returns trigger language plpgsql security definer set search_path = '' as $$
declare normalized_email text; normalized_ip text;
begin
  if new.type is distinct from 'claim' or new.verification_code_hash is null then
    return new;
  end if;
  normalized_email := lower(btrim(new.email));
  normalized_ip := nullif(lower(btrim(new.ip)), '');
  -- Toujours email puis IP : deux requêtes simultanées partagent le même
  -- verrou et relisent le nombre d'émissions une fois la précédente terminée.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('workwave:claim:email:' || normalized_email, 0));
  if normalized_ip is not null and normalized_ip <> 'unknown' then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('workwave:claim:ip:' || normalized_ip, 0));
  end if;
  if (select count(*) from public.claim_attempts
      where type = 'claim' and code_expires_at is not null
        and lower(btrim(email)) = normalized_email
        and created_at >= now() - interval '15 minutes') >= 3 then
    raise exception 'claim_rate_limited';
  end if;
  if normalized_ip is not null and normalized_ip <> 'unknown'
    and (select count(*) from public.claim_attempts
      where type = 'claim' and code_expires_at is not null
        and lower(btrim(ip)) = normalized_ip
        and created_at >= now() - interval '1 hour') >= 20 then
    raise exception 'claim_rate_limited';
  end if;
  return new;
end;
$$;
revoke all on function public.limit_pro_claim_code_emissions() from public, anon, authenticated;
drop trigger if exists limit_pro_claim_code_emissions on public.claim_attempts;
create trigger limit_pro_claim_code_emissions before insert on public.claim_attempts
  for each row execute function public.limit_pro_claim_code_emissions();

create table if not exists public.pro_claim_requests (
  id bigint generated always as identity primary key,
  pro_id bigint not null references public.pros(id) on delete cascade,
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  claim_attempt_id bigint unique references public.claim_attempts(id) on delete set null,
  verified_email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_note text
);
create index if not exists pro_claim_requests_queue on public.pro_claim_requests(status, created_at);
create index if not exists pro_claim_requests_user on public.pro_claim_requests(requester_user_id, created_at);
alter table public.pro_claim_requests enable row level security;
revoke all on public.pro_claim_requests from public, anon, authenticated;
grant select, insert, update on public.pro_claim_requests to service_role;
grant usage, select on sequence public.pro_claim_requests_id_seq to service_role;

-- Le verrou sérialise les essais de code : trois essais maximum, un seul usage.
-- Seul le serveur peut recevoir le mot de passe temporaire ; il est effacé en base.
create or replace function public.consume_pro_claim_code(p_attempt_id bigint, p_slug text, p_code_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.claim_attempts%rowtype; p public.pros%rowtype; result jsonb;
begin
  select * into a from public.claim_attempts where id = p_attempt_id for update;
  if not found or a.status is distinct from 'pending' or a.type is distinct from 'claim' then
    return jsonb_build_object('error', 'invalid');
  end if;
  if a.code_expires_at is null or a.code_expires_at <= now() then
    update public.claim_attempts set status = 'expired', temp_password = null, verification_code_hash = null where id = a.id;
    return jsonb_build_object('error', 'expired');
  end if;
  if coalesce(a.attempts_count, 0) >= 3 then
    update public.claim_attempts set status = 'blocked', temp_password = null, verification_code_hash = null where id = a.id;
    return jsonb_build_object('error', 'blocked');
  end if;
  if p_code_hash is null or a.verification_code_hash is distinct from p_code_hash then
    update public.claim_attempts set attempts_count = coalesce(a.attempts_count, 0) + 1,
      status = case when coalesce(a.attempts_count, 0) >= 2 then 'blocked' else 'pending' end,
      temp_password = case when coalesce(a.attempts_count, 0) >= 2 then null else a.temp_password end,
      verification_code_hash = case when coalesce(a.attempts_count, 0) >= 2 then null else a.verification_code_hash end
      where id = a.id;
    return jsonb_build_object('error', 'code', 'remaining', greatest(0, 2 - coalesce(a.attempts_count, 0)));
  end if;
  select * into p from public.pros where slug = p_slug;
  if not found or p.deleted_at is not null or p.claimed_by_user_id is not null
    or a.target_pro_id is distinct from p.id
    or p.siret is null or p.siret is distinct from a.siret or a.temp_password is null then
    return jsonb_build_object('error', 'unavailable');
  end if;
  result := jsonb_build_object('attempt_id', a.id, 'pro_id', p.id, 'email', lower(btrim(a.email)), 'password', a.temp_password);
  update public.claim_attempts set status = 'verified', success = false,
    verification_code_hash = null, temp_password = null where id = a.id;
  return result;
end;
$$;

create or replace function public.enqueue_pro_claim(p_attempt_id bigint, p_pro_id bigint, p_user_id uuid)
returns bigint language plpgsql security definer set search_path = '' as $$
declare a public.claim_attempts%rowtype; p public.pros%rowtype; request_id bigint;
begin
  select * into a from public.claim_attempts where id = p_attempt_id for update;
  if not found or a.status is distinct from 'verified' or a.type is distinct from 'claim' then
    raise exception 'invalid_claim_attempt';
  end if;
  select * into p from public.pros where id = p_pro_id;
  if not found or p.deleted_at is not null or p.claimed_by_user_id is not null
    or a.target_pro_id is distinct from p.id
    or p.siret is null or p.siret is distinct from a.siret then raise exception 'pro_unavailable'; end if;
  if not exists (select 1 from auth.users where id = p_user_id
    and lower(btrim(email)) = lower(btrim(a.email)) and email_confirmed_at is not null) then
    raise exception 'verified_email_mismatch';
  end if;
  insert into public.pro_claim_requests(pro_id, requester_user_id, claim_attempt_id, verified_email)
    values (p.id, p_user_id, a.id, lower(btrim(a.email)))
    on conflict (claim_attempt_id) do nothing returning id into request_id;
  if request_id is null then raise exception 'claim_already_queued'; end if;
  return request_id;
end;
$$;

-- Autorisation explicite + verrou de la fiche et de la demande dans UNE transaction.
create or replace function public.review_pro_claim(p_request_id bigint, p_admin_user_id uuid, p_decision text, p_note text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.pro_claim_requests%rowtype; p public.pros%rowtype; a public.claim_attempts%rowtype;
begin
  if not exists (select 1 from public.admins where user_id = p_admin_user_id and role in ('admin', 'superadmin')) then
    raise exception 'admin_required';
  end if;
  if p_decision is null or p_decision not in ('approved', 'rejected')
    or p_note is null or length(btrim(p_note)) < 10 or length(p_note) > 2000 then raise exception 'review_required'; end if;
  select * into r from public.pro_claim_requests where id = p_request_id for update;
  if not found or r.status <> 'pending' then raise exception 'claim_already_reviewed'; end if;
  select * into p from public.pros where id = r.pro_id for update;
  if p_decision = 'approved' then
    if not found or p.deleted_at is not null or p.claimed_by_user_id is not null then raise exception 'pro_unavailable'; end if;
    select * into a from public.claim_attempts where id = r.claim_attempt_id;
    if not found or a.status is distinct from 'verified' or a.type is distinct from 'claim'
      or a.target_pro_id is distinct from p.id
      or p.siret is null or p.siret is distinct from a.siret
      or lower(btrim(a.email)) is distinct from r.verified_email then raise exception 'claim_changed'; end if;
    if not exists (select 1 from auth.users where id = r.requester_user_id
      and lower(btrim(email)) = r.verified_email and email_confirmed_at is not null) then
      raise exception 'verified_email_mismatch';
    end if;
    update public.pros set claimed_by_user_id = r.requester_user_id, claimed_at = now(),
      email = r.verified_email, subscription_status = 'none', trial_ends_at = null,
      intervention_radius_km = 200 where id = r.pro_id;
    update public.claim_attempts set success = true where id = r.claim_attempt_id;
  end if;
  update public.pro_claim_requests set status = p_decision, reviewed_at = now(),
    reviewed_by = p_admin_user_id, review_note = btrim(p_note) where id = r.id;
  return jsonb_build_object('pro_id', r.pro_id, 'slug', p.slug, 'email', r.verified_email, 'user_id', r.requester_user_id, 'status', p_decision);
end;
$$;

revoke all on function public.consume_pro_claim_code(bigint, text, text) from public, anon, authenticated;
revoke all on function public.enqueue_pro_claim(bigint, bigint, uuid) from public, anon, authenticated;
revoke all on function public.review_pro_claim(bigint, uuid, text, text) from public, anon, authenticated;
grant execute on function public.consume_pro_claim_code(bigint, text, text) to service_role;
grant execute on function public.enqueue_pro_claim(bigint, bigint, uuid) to service_role;
grant execute on function public.review_pro_claim(bigint, uuid, text, text) to service_role;
commit;
