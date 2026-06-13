-- Bulk UPDATE ancienneté/effectif pour le backfill SIRENE (script
-- scraping/backfill_sirene_stock.py). Un upsert ne marche PAS ici : il
-- tenterait un INSERT (slug NOT NULL absent du payload) → 23502 sur tous
-- les chunks (bug 12/06 : 2,28M matches, 0 maj). On fait de vrais UPDATE
-- en masse via une RPC qui reçoit un tableau jsonb (1 round-trip / 500 lignes).
-- À COLLER DANS LE SQL EDITOR SUPABASE.

CREATE OR REPLACE FUNCTION backfill_pro_founding(items jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE n integer;
BEGIN
  UPDATE pros p
  SET founding_date  = NULLIF(x->>'founding_date', '')::date,
      founded_year   = (x->>'founded_year')::int,
      effectif_range = COALESCE(NULLIF(x->>'effectif_range', ''), p.effectif_range),
      updated_at     = now()
  FROM jsonb_array_elements(items) AS x
  WHERE p.siret = x->>'siret'
    AND p.founded_year IS NULL;   -- idempotent : n'écrase jamais une fiche déjà enrichie
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

NOTIFY pgrst, 'reload schema';
