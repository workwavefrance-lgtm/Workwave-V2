-- Journal des notifications de projets. À appliquer AVANT le code qui l'utilise.
-- Aucun rattrapage depuis project_leads : les anciens statuts "sent" ne
-- prouvent pas un succès Resend. Les diffusions déjà finalisées restent telles quelles.
BEGIN;

CREATE TABLE IF NOT EXISTS public.project_email_deliveries (
  project_id INTEGER NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  pro_id BIGINT NOT NULL REFERENCES public.pros(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('initial', 'j1', 'j3')),
  -- Corps figé pour pouvoir rejouer exactement la même requête Resend.
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  provider_id TEXT,
  last_error TEXT,
  PRIMARY KEY (project_id, pro_id, kind)
);

ALTER TABLE public.project_email_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.project_email_deliveries FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_email_deliveries TO service_role;
CREATE INDEX IF NOT EXISTS project_email_deliveries_pending
  ON public.project_email_deliveries(first_attempt_at) WHERE sent_at IS NULL;

-- Les retraits passent souvent par soft-delete : la cascade FK ne suffit pas.
CREATE OR REPLACE FUNCTION public.purge_project_email_deliveries()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_TABLE_NAME = 'projects' THEN
    IF NEW.status = 'deleted' THEN
      DELETE FROM public.project_email_deliveries WHERE project_id = NEW.id;
    END IF;
  ELSIF NEW.deleted_at IS NOT NULL THEN
    DELETE FROM public.project_email_deliveries WHERE pro_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.purge_project_email_deliveries() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS purge_project_email_deliveries ON public.projects;
CREATE TRIGGER purge_project_email_deliveries
  AFTER UPDATE OF status ON public.projects FOR EACH ROW
  EXECUTE FUNCTION public.purge_project_email_deliveries();
DROP TRIGGER IF EXISTS purge_pro_email_deliveries ON public.pros;
CREATE TRIGGER purge_pro_email_deliveries
  AFTER UPDATE OF deleted_at ON public.pros FOR EACH ROW
  EXECUTE FUNCTION public.purge_project_email_deliveries();

CREATE OR REPLACE FUNCTION public.guard_project_email_delivery()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  -- Le verrou dure la transaction de préparation, puis l'envoi externe reste
  -- nécessairement hors transaction. Un email déjà en vol n'est pas révocable.
  PERFORM 1 FROM public.projects WHERE id = NEW.project_id
    AND status NOT IN ('deleted', 'closed') FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Projet indisponible pour diffusion'; END IF;
  PERFORM 1 FROM public.pros WHERE id = NEW.pro_id
    AND deleted_at IS NULL AND is_active = true AND do_not_contact = false
    AND claimed_by_user_id IS NOT NULL
    AND (paused_until IS NULL OR paused_until <= now()) FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Professionnel indisponible pour diffusion'; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_project_email_delivery() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_project_email_delivery ON public.project_email_deliveries;
CREATE TRIGGER guard_project_email_delivery BEFORE INSERT
  ON public.project_email_deliveries FOR EACH ROW
  EXECUTE FUNCTION public.guard_project_email_delivery();

COMMIT;
