/**
 * Backfill postal_code + city_id des fiches source="manual" créées via
 * /pro/creer-fiche sans CP/ville (champs cachés vides à la soumission).
 * Source officielle : recherche-entreprises.api.gouv.fr par SIRET (gratuit).
 * Cas déclencheur : renov-toit-00013 réclamée le 12/06, adresse sans CP/ville
 * sur la fiche publique + invisible des broadcasts (city_id null).
 *
 *   npx tsx scripts/_backfill-manual-city.ts            # DRY-RUN
 *   npx tsx scripts/_backfill-manual-city.ts --execute
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local", override: true });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const EXECUTE = process.argv.includes("--execute");

function normalizeName(x: string): string {
  return x.toLowerCase().normalize("NFD").replace(/\p{Mn}/gu, "").replace(/[^a-z0-9]/g, "");
}

async function lookupSiret(siret: string): Promise<{ cp: string | null; commune: string | null; adresse: string | null } | null> {
  const r = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${siret}&page=1&per_page=1`);
  if (!r.ok) return null;
  const j = await r.json();
  const res = j?.results?.[0];
  if (!res) return null;
  // L'établissement qui matche le SIRET : siège ou matching_etablissements
  const etabs = [res.siege, ...(res.matching_etablissements || [])].filter(Boolean);
  const etab = etabs.find((e: any) => e.siret === siret) || res.siege;
  if (!etab) return null;
  return {
    cp: etab.code_postal || null,
    commune: etab.libelle_commune || null,
    adresse: etab.adresse || null,
  };
}

async function matchCityId(commune: string | null, cp: string | null): Promise<number | null> {
  // Cas non-diffusible : CP masqué « [NON-DIFFUSIBLE] » mais commune visible
  // → recherche globale par nom normalisé (on n'écrit que si match UNIQUE).
  if ((!cp || !/^\d{5}$/.test(cp)) && commune) {
    const target = normalizeName(commune);
    const { data: all } = await sb.from("cities").select("id, name").ilike("name", `%${commune.split(/[\s-]/)[0]}%`);
    const matches = (all || []).filter((c) => normalizeName(c.name) === target);
    return matches.length === 1 ? matches[0].id : null;
  }
  if (!cp || !/^\d{5}$/.test(cp)) return null;
  const deptCode = cp.slice(0, 2);
  const { data: dept } = await sb.from("departments").select("id").eq("code", deptCode).maybeSingle();
  if (!dept) return null;
  const { data: cities } = await sb.from("cities").select("id, name, postal_code").eq("department_id", dept.id);
  if (!cities?.length) return null;
  if (commune) {
    const target = normalizeName(commune);
    const byName = cities.find((c) => normalizeName(c.name) === target);
    if (byName) return byName.id;
  }
  // fallback : match exact sur le code postal (1ère commune du CP)
  const byCp = cities.find((c) => c.postal_code === cp);
  return byCp?.id ?? null;
}

async function main() {
  console.log(`\n=== BACKFILL CP/ville fiches manual · ${EXECUTE ? "EXECUTE" : "DRY-RUN"} ===\n`);
  const { data: pros } = await sb.from("pros")
    .select("id, slug, name, siret, address, postal_code, city_id")
    .eq("source", "manual").is("city_id", null)
    .eq("is_active", true).is("deleted_at", null);
  console.log(`${(pros || []).length} fiches manual sans city_id\n`);

  for (const p of pros || []) {
    if (!p.siret) { console.log(`- ${p.slug} : pas de SIRET, skip`); continue; }
    const info = await lookupSiret(p.siret);
    if (!info) { console.log(`- ${p.slug} : introuvable via API, skip`); continue; }
    const cityId = await matchCityId(info.commune, info.cp);
    console.log(`${p.slug} (${p.name})`);
    console.log(`  API : ${info.adresse || "?"}, ${info.cp} ${info.commune} → city_id ${cityId ?? "NON MATCHÉE (hors couverture ?)"}`);
    if (EXECUTE && (info.cp || cityId)) {
      const patch: Record<string, unknown> = {};
      const validCp = info.cp && /^\d{5}$/.test(info.cp) ? info.cp : null;
      if (validCp && !p.postal_code) patch.postal_code = validCp;
      // CP masqué (non-diffusible) : prendre celui de la commune matchée
      if (!validCp && cityId && !p.postal_code) {
        const { data: c } = await sb.from("cities").select("postal_code").eq("id", cityId).single();
        if (c?.postal_code) patch.postal_code = c.postal_code;
      }
      if (cityId) patch.city_id = cityId;
      const { error } = await sb.from("pros").update(patch).eq("id", p.id);
      console.log(error ? `  ❌ ${error.message}` : `  ✓ UPDATE ${Object.keys(patch).join("+")}`);
    }
    await new Promise((r) => setTimeout(r, 400)); // rate-limit API gouv
  }
  if (!EXECUTE) console.log("\n[DRY-RUN] relancer avec --execute pour écrire.");
}
main().catch((e) => { console.error(e); process.exit(1); });
