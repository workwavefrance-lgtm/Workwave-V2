/**
 * Enrichit les pros Workwave avec les donnees Sirene v3 (date creation,
 * tranche effectif, etat administratif) via l'API publique
 * recherche-entreprises.api.gouv.fr (gratuite, pas de token).
 *
 * Strategie phase 1 : enrichir uniquement les pros prioritaires
 *   - claimed_by_user_id IS NOT NULL (les abonnes / claimed)
 *   - rge_certified = true (les pros RGE = signal qualite haut)
 * Soit ~3 866 pros sur 226k. Si la phase 1 marche bien, on etendra.
 *
 * L'API recherche-entreprises a un rate limit ~7 req/s, on met 150ms
 * entre requetes pour rester sous le seuil. Total estime : ~10 min.
 *
 * Effet :
 *   - Affichage "Entreprise creee en 2008 - 5 a 9 salaries" sur la fiche
 *   - Auto-desactivation des pros radies (etat_admin = 'C') :
 *     is_active = false + deleted_at = now()
 *
 * Run :
 *   npx tsx scripts/enrich-sirene-v3.ts                # dry-run
 *   npx tsx scripts/enrich-sirene-v3.ts --apply        # applique
 *   npx tsx scripts/enrich-sirene-v3.ts --apply --all  # tous les pros (long, ~9h)
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
  override: true,
});

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APPLY = process.argv.includes("--apply");
const ALL = process.argv.includes("--all");
const RATE_LIMIT_MS = 150;
const API_BASE = "https://recherche-entreprises.api.gouv.fr/search";

type SireneEnrichment = {
  proId: number;
  founding_date: string | null;
  effectif_range: string | null;
  etat_admin: "A" | "C" | "F" | null;
};

async function fetchSireneData(
  siret: string
): Promise<{ founding_date: string | null; effectif_range: string | null; etat_admin: string | null } | null> {
  try {
    const r = await fetch(`${API_BASE}?q=${siret}&page=1&per_page=1`);
    if (!r.ok) return null;
    const data = (await r.json()) as { results?: Array<{ date_creation?: string; tranche_effectif_salarie?: string; etat_administratif?: string }> };
    const result = data.results?.[0];
    if (!result) return null;
    return {
      founding_date: result.date_creation || null,
      effectif_range: result.tranche_effectif_salarie || null,
      etat_admin: result.etat_administratif || null,
    };
  } catch {
    return null;
  }
}

async function fetchTargetPros(): Promise<{ id: number; siret: string }[]> {
  const all: { id: number; siret: string }[] = [];
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    let q = supabase
      .from("pros")
      .select("id, siret")
      .not("siret", "is", null)
      .eq("is_active", true)
      .is("deleted_at", null);
    if (!ALL) {
      // Phase 1 : claimed OU rge_certified
      q = q.or("claimed_by_user_id.not.is.null,rge_certified.eq.true");
    }
    const { data } = await q
      .order("id", { ascending: true })
      .range(offset, offset + PAGE - 1);
    const rows = (data || []) as { id: number; siret: string }[];
    if (rows.length === 0) break;
    all.push(...rows);
    offset += rows.length;
  }
  return all;
}

async function main() {
  console.log("=== Enrich Sirene v3 (recherche-entreprises.api.gouv.fr) ===\n");
  console.log(`Mode : ${ALL ? "ALL pros (long)" : "Phase 1 (claimed + RGE only)"}\n`);

  // 1. Pull pros cibles
  console.log("1. Pull pros cibles...");
  const pros = await fetchTargetPros();
  console.log(`   -> ${pros.length} pros a enrichir\n`);

  if (pros.length === 0) {
    console.log("Aucun pro a enrichir.");
    return;
  }

  if (!APPLY) {
    console.log("[DRY-RUN] Pour appliquer :");
    console.log("  npx tsx scripts/enrich-sirene-v3.ts --apply");
    console.log("\nSample (3 lookups) :");
    for (const p of pros.slice(0, 3)) {
      const data = await fetchSireneData(p.siret);
      console.log(`  pro id=${p.id} siret=${p.siret} ->`, data);
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
    }
    return;
  }

  // 2. Lookup + update
  console.log("2. Lookup Sirene + update batch...");
  const startedAt = Date.now();
  let done = 0;
  let radies = 0;
  let errors = 0;
  const enrichments: SireneEnrichment[] = [];

  for (const p of pros) {
    const sirene = await fetchSireneData(p.siret);
    if (sirene) {
      enrichments.push({
        proId: p.id,
        founding_date: sirene.founding_date,
        effectif_range: sirene.effectif_range,
        etat_admin: sirene.etat_admin as "A" | "C" | "F" | null,
      });
      if (sirene.etat_admin === "C") radies++;
    } else {
      errors++;
    }
    done++;
    if (done % 100 === 0) {
      const elapsed = (Date.now() - startedAt) / 1000;
      const rate = done / elapsed;
      const remaining = Math.round((pros.length - done) / rate);
      console.log(
        `   ${done}/${pros.length} | ${rate.toFixed(1)} req/s | reste ~${remaining}s | radies detectes: ${radies} | errors: ${errors}`
      );
    }
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }

  console.log(`\nLookups termines : ${done}, radies ${radies}, errors ${errors}`);

  // 3. Update batch des actifs
  console.log("\n3. Update Supabase (chunks paralleles de 50)...");
  const now = new Date().toISOString();
  const actifsToUpdate = enrichments.filter((e) => e.etat_admin !== "C");
  const radiesToDelete = enrichments.filter((e) => e.etat_admin === "C");

  let upd = 0;
  const CHUNK = 50;
  for (let i = 0; i < actifsToUpdate.length; i += CHUNK) {
    const chunk = actifsToUpdate.slice(i, i + CHUNK);
    await Promise.all(
      chunk.map((e) =>
        supabase
          .from("pros")
          .update({
            founding_date: e.founding_date,
            effectif_range: e.effectif_range,
            etat_admin: e.etat_admin || "A",
            sirene_synced_at: now,
          })
          .eq("id", e.proId)
      )
    );
    upd += chunk.length;
  }
  console.log(`   ${upd} pros actifs enrichis.`);

  // 4. Soft delete des radies (auto-desactivation)
  if (radiesToDelete.length > 0) {
    console.log(
      `\n4. Soft delete des ${radiesToDelete.length} pros radies (etat_admin = 'C')...`
    );
    let del = 0;
    for (let i = 0; i < radiesToDelete.length; i += CHUNK) {
      const chunk = radiesToDelete.slice(i, i + CHUNK);
      await Promise.all(
        chunk.map((e) =>
          supabase
            .from("pros")
            .update({
              is_active: false,
              deleted_at: now,
              etat_admin: "C",
              sirene_synced_at: now,
            })
            .eq("id", e.proId)
        )
      );
      del += chunk.length;
    }
    console.log(`   ${del} pros radies desactives (is_active=false + deleted_at).`);
  }

  console.log(`\nSync date : ${now}.`);
  console.log(
    `\nVerification : SELECT COUNT(*) FROM pros WHERE sirene_synced_at IS NOT NULL; -- doit retourner ${enrichments.length}`
  );
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
