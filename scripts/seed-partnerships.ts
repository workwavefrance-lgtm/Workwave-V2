/**
 * Seed les partenariats locaux dans la table partnerships.
 *
 * 1. Mairies + offices de tourisme via API publique data.gouv.fr
 *    (annuaire-administration). 100% public, RGPD-safe.
 *    Filtre : pivot LIKE "%mairie%" + code_insee_commune dont les 2
 *    premiers chars sont dans la liste des 12 dept Nouvelle-Aquitaine.
 *
 * 2. CCI + Chambres des Metiers en dur (12 + 12, donnees publiques).
 *
 * Idempotent : ON CONFLICT (contact_email) DO NOTHING.
 *
 * Exec : npx tsx scripts/seed-partnerships.ts
 *        npx tsx scripts/seed-partnerships.ts --only=mairies
 *        npx tsx scripts/seed-partnerships.ts --only=cci
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NA_DEPT_CODES = new Set([
  "16",
  "17",
  "19",
  "23",
  "24",
  "33",
  "40",
  "47",
  "64",
  "79",
  "86",
  "87",
]);

const API_BASE =
  "https://api-lannuaire.service-public.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records";

type RawMairie = {
  nom: string | null;
  code_insee_commune: string | null;
  adresse_courriel: string | null;
  telephone: string | null; // JSON encode
  site_internet: string | null; // JSON encode
  adresse: string | null; // JSON encode
};

function parseJsonField<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function extractFirstValeur(jsonStr: string | null): string | null {
  const arr = parseJsonField<Array<{ valeur?: string }>>(jsonStr);
  if (!arr || arr.length === 0) return null;
  return arr[0].valeur?.trim() || null;
}

type AdresseEntry = {
  code_postal?: string;
  nom_commune?: string;
};

function extractCity(jsonStr: string | null): {
  postal_code: string | null;
  city: string | null;
} {
  const arr = parseJsonField<AdresseEntry[]>(jsonStr);
  if (!arr || arr.length === 0) return { postal_code: null, city: null };
  return {
    postal_code: arr[0].code_postal?.trim() || null,
    city: arr[0].nom_commune?.trim() || null,
  };
}

async function fetchMairiesPage(
  offset: number,
  limit = 100
): Promise<RawMairie[]> {
  const url = new URL(API_BASE);
  // Le bon filtre : pivot contient "mairie" + select des champs utiles
  url.searchParams.set("where", `pivot LIKE "%mairie%"`);
  url.searchParams.set(
    "select",
    "nom,code_insee_commune,adresse_courriel,telephone,site_internet,adresse"
  );
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    console.error(`[seed] API error ${res.status} :`, body.slice(0, 200));
    return [];
  }
  const json = (await res.json()) as { results?: RawMairie[] };
  return json.results ?? [];
}

async function seedMairies(): Promise<{ inserted: number; skipped: number }> {
  console.log("\n=== Seed mairies via data.gouv.fr ===");
  const allRows: RawMairie[] = [];
  let offset = 0;
  const PAGE = 100;
  // L'API a ~35857 mairies en France. On les recupere toutes puis on filtre
  // cote script par dept_code (les 2 premiers chiffres du code_insee).
  // L'API a un cap a 10000 results via offset. Du coup on doit filtrer
  // cote serveur sur le code_insee_commune. Strategie : faire 12 requetes
  // une par dept code (where = pivot LIKE "%mairie%" AND code_insee_commune
  // LIKE "86%").

  for (const deptCode of NA_DEPT_CODES) {
    console.log(`  Dept ${deptCode}...`);
    offset = 0;
    while (offset < 5000) {
      const url = new URL(API_BASE);
      // API ODSQL : LIKE "86%" ne marche pas sur code_insee_commune,
      // mais startswith() oui. Cf. test 24/05/2026.
      url.searchParams.set(
        "where",
        `pivot LIKE "%mairie%" AND startswith(code_insee_commune, "${deptCode}")`
      );
      url.searchParams.set(
        "select",
        "nom,code_insee_commune,adresse_courriel,telephone,site_internet,adresse"
      );
      url.searchParams.set("limit", String(PAGE));
      url.searchParams.set("offset", String(offset));
      const res = await fetch(url.toString());
      if (!res.ok) {
        console.error(`    error ${res.status}`);
        break;
      }
      const json = (await res.json()) as { results?: RawMairie[] };
      const batch = json.results ?? [];
      if (batch.length === 0) break;
      allRows.push(...batch);
      if (batch.length < PAGE) break;
      offset += PAGE;
      await new Promise((r) => setTimeout(r, 150));
    }
    console.log(`    cumul ${allRows.length}`);
  }
  console.log(`Total mairies NA recupérées : ${allRows.length}`);

  // Filtre supplementaire : email valide + bon dept
  const inserts: Array<Record<string, unknown>> = [];
  for (const org of allRows) {
    const email = (org.adresse_courriel ?? "").trim();
    if (!email || !email.includes("@")) continue;
    const dept = org.code_insee_commune?.slice(0, 2);
    if (!dept || !NA_DEPT_CODES.has(dept)) continue;
    const { postal_code, city } = extractCity(org.adresse);
    const phone = extractFirstValeur(org.telephone);
    const website = extractFirstValeur(org.site_internet);

    inserts.push({
      type: "mairie",
      name: org.nom?.trim() ?? "Mairie",
      organization: city ? `Commune de ${city}` : null,
      contact_email: email.toLowerCase(),
      contact_phone: phone,
      website,
      postal_code,
      city,
      department_code: dept,
      status: "to_contact",
    });
  }
  console.log(`Filtres valides : ${inserts.length} mairies a inserer`);

  if (inserts.length === 0) return { inserted: 0, skipped: 0 };

  // Insert en batchs de 500. ON CONFLICT (contact_email) DO NOTHING.
  let inserted = 0;
  let skipped = 0;
  const BATCH = 500;
  for (let i = 0; i < inserts.length; i += BATCH) {
    const chunk = inserts.slice(i, i + BATCH);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb.from("partnerships") as any)
      .upsert(chunk, {
        onConflict: "contact_email",
        ignoreDuplicates: true,
      })
      .select("id");
    if (error) {
      console.error(`  Batch ${i}/${inserts.length} erreur :`, error.message);
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ins = (data as any[])?.length ?? 0;
    inserted += ins;
    skipped += chunk.length - ins;
    console.log(`  Batch +${ins} (cumul ${inserted}/${inserts.length})`);
  }
  return { inserted, skipped };
}

// CCI + Chambres des Metiers (donnees publiques, sites officiels verifies)
const CCI_CMA_DATA: Array<{
  type: "cci" | "chambre_metiers";
  name: string;
  contact_email: string;
  website?: string;
  city: string;
  postal_code?: string;
  department_code: string;
}> = [
  { type: "cci", name: "CCI Bordeaux-Gironde", contact_email: "contact@bordeauxgironde.cci.fr", website: "https://www.bordeauxgironde.cci.fr", city: "Bordeaux", postal_code: "33075", department_code: "33" },
  { type: "cci", name: "CCI de la Vienne", contact_email: "contact@poitiers.cci.fr", website: "https://www.poitiers.cci.fr", city: "Poitiers", postal_code: "86000", department_code: "86" },
  { type: "cci", name: "CCI Charente", contact_email: "cci@charente.cci.fr", website: "https://www.charente.cci.fr", city: "Angoulême", postal_code: "16021", department_code: "16" },
  { type: "cci", name: "CCI La Rochelle Rochefort Saintonge", contact_email: "contact@larochelle.cci.fr", website: "https://www.larochelle.cci.fr", city: "La Rochelle", postal_code: "17024", department_code: "17" },
  { type: "cci", name: "CCI Dordogne", contact_email: "contact@dordogne.cci.fr", website: "https://www.dordogne.cci.fr", city: "Périgueux", postal_code: "24000", department_code: "24" },
  { type: "cci", name: "CCI Landes", contact_email: "info@landes.cci.fr", website: "https://www.landes.cci.fr", city: "Mont-de-Marsan", postal_code: "40000", department_code: "40" },
  { type: "cci", name: "CCI Lot-et-Garonne", contact_email: "info@lot-et-garonne.cci.fr", website: "https://www.lot-et-garonne.cci.fr", city: "Agen", postal_code: "47000", department_code: "47" },
  { type: "cci", name: "CCI Bayonne Pays Basque", contact_email: "contact@bayonne.cci.fr", website: "https://www.bayonne.cci.fr", city: "Bayonne", postal_code: "64100", department_code: "64" },
  { type: "cci", name: "CCI Pau Béarn", contact_email: "contact@pau.cci.fr", website: "https://www.pau.cci.fr", city: "Pau", postal_code: "64012", department_code: "64" },
  { type: "cci", name: "CCI Deux-Sèvres", contact_email: "info@cci79.com", website: "https://www.cci79.com", city: "Niort", postal_code: "79003", department_code: "79" },
  { type: "cci", name: "CCI Limoges Haute-Vienne", contact_email: "contact@limoges.cci.fr", website: "https://www.limoges.cci.fr", city: "Limoges", postal_code: "87000", department_code: "87" },
  { type: "cci", name: "CCI Corrèze", contact_email: "info@correze.cci.fr", website: "https://www.correze.cci.fr", city: "Tulle", postal_code: "19000", department_code: "19" },
  { type: "chambre_metiers", name: "CMA Nouvelle-Aquitaine — siège", contact_email: "contact@cma-nouvelleaquitaine.fr", website: "https://www.cma-nouvelleaquitaine.fr", city: "Limoges", department_code: "87" },
  { type: "chambre_metiers", name: "CMA Charente", contact_email: "contact@cm-angouleme.fr", website: "https://www.cma-nouvelleaquitaine.fr/charente", city: "Angoulême", department_code: "16" },
  { type: "chambre_metiers", name: "CMA Charente-Maritime", contact_email: "contact@cma17.fr", website: "https://www.cma-nouvelleaquitaine.fr/charente-maritime", city: "Lagord", department_code: "17" },
  { type: "chambre_metiers", name: "CMA Corrèze", contact_email: "accueil-cma19@cma-correze.fr", website: "https://www.cma-nouvelleaquitaine.fr/correze", city: "Tulle", department_code: "19" },
  { type: "chambre_metiers", name: "CMA Creuse", contact_email: "accueil@cma-creuse.fr", website: "https://www.cma-nouvelleaquitaine.fr/creuse", city: "Guéret", department_code: "23" },
  { type: "chambre_metiers", name: "CMA Dordogne", contact_email: "accueil@cma-dordogne.fr", website: "https://www.cma-nouvelleaquitaine.fr/dordogne", city: "Boulazac", department_code: "24" },
  { type: "chambre_metiers", name: "CMA Gironde", contact_email: "contact@cm-bordeaux.fr", website: "https://www.cma-nouvelleaquitaine.fr/gironde", city: "Bordeaux", department_code: "33" },
  { type: "chambre_metiers", name: "CMA Landes", contact_email: "accueil@cma-landes.fr", website: "https://www.cma-nouvelleaquitaine.fr/landes", city: "Mont-de-Marsan", department_code: "40" },
  { type: "chambre_metiers", name: "CMA Lot-et-Garonne", contact_email: "accueil@cma-47.fr", website: "https://www.cma-nouvelleaquitaine.fr/lot-et-garonne", city: "Agen", department_code: "47" },
  { type: "chambre_metiers", name: "CMA Pyrénées-Atlantiques", contact_email: "accueil@cma64.fr", website: "https://www.cma-nouvelleaquitaine.fr/pyrenees-atlantiques", city: "Pau", department_code: "64" },
  { type: "chambre_metiers", name: "CMA Deux-Sèvres", contact_email: "contact@artisans79.fr", website: "https://www.cma-nouvelleaquitaine.fr/deux-sevres", city: "Niort", department_code: "79" },
  { type: "chambre_metiers", name: "CMA Vienne", contact_email: "accueil@cma-vienne.fr", website: "https://www.cma-nouvelleaquitaine.fr/vienne", city: "Poitiers", department_code: "86" },
  { type: "chambre_metiers", name: "CMA Haute-Vienne", contact_email: "accueil@cma87.fr", website: "https://www.cma-nouvelleaquitaine.fr/haute-vienne", city: "Limoges", department_code: "87" },
];

async function seedCciCma(): Promise<{ inserted: number; skipped: number }> {
  console.log("\n=== Seed CCI + Chambres des Metiers ===");
  const rows = CCI_CMA_DATA.map((r) => ({
    ...r,
    contact_email: r.contact_email.toLowerCase().trim(),
    status: "to_contact",
  }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("partnerships") as any)
    .upsert(rows, {
      onConflict: "contact_email",
      ignoreDuplicates: true,
    })
    .select("id");
  if (error) {
    console.error("Erreur insert CCI/CMA :", error.message);
    return { inserted: 0, skipped: 0 };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inserted = (data as any[])?.length ?? 0;
  console.log(`  ${inserted}/${rows.length} CCI/CMA inseres`);
  return { inserted, skipped: rows.length - inserted };
}

async function main() {
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg?.slice("--only=".length) ?? "all";

  if (only === "all" || only === "mairies") {
    const r = await seedMairies();
    console.log(`\n→ Mairies : ${r.inserted} inseres, ${r.skipped} skipped\n`);
  }
  if (only === "all" || only === "cci") {
    const r = await seedCciCma();
    console.log(`\n→ CCI/CMA : ${r.inserted} inseres, ${r.skipped} skipped\n`);
  }

  console.log("=== Done ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
