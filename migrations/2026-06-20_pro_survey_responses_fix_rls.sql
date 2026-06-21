-- Correctif RLS pour pro_survey_responses.
-- Bug : la policy d'insert ne ciblait que le rôle "anon", donc un utilisateur
-- CONNECTÉ (admin/pro, rôle "authenticated") ne pouvait pas soumettre le
-- formulaire public (erreur "violates row-level security policy").
-- Fix : autoriser l'insert pour anon ET authenticated. Et on retire la policy
-- de lecture "authenticated" (qui aurait exposé toutes les réponses — dont les
-- contacts — à n'importe quel pro connecté). La vue admin lit via le service
-- role (getAdminServiceClient), qui bypasse la RLS : pattern existant + plus sûr.

drop policy if exists "survey_anon_insert" on pro_survey_responses;
drop policy if exists "survey_authenticated_select" on pro_survey_responses;

create policy "survey_public_insert" on pro_survey_responses
  for insert to anon, authenticated with check (true);

grant insert on pro_survey_responses to anon, authenticated;

notify pgrst, 'reload schema';
