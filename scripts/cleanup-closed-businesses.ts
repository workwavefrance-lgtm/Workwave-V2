/**
 * Script de nettoyage — Détecte les établissements fermés via l'API Recherche d'entreprises
 * et marque les pros correspondants comme inactifs (is_active = false).
 *
 * Usage : npx tsx scripts/cleanup-closed-businesses.ts
 * Durée estimée : ~68 minutes pour 20 330 pros (5 req/s)
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";

// ============================================
// Configuration
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const API_BASE = "https://recherche-entreprises.api.gouv.fr/search";
const REQUESTS_PER_SECOND = 5;
const DELAY_MS = Math.ceil(1000 / REQUESTS_PER_SECOND); // 200ms entre chaque requête
const BATCH_SIZE = 100;
const FETCH_TIMEOUT_MS = 10_000;

// ============================================
// Supabase client (service role, pas de cookies)
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================
// Types API
// ============================================

type Etablissement = {
  siret: string;
  etat_administratif: "A" | "F"; // A = actif, F = fermé
  adresse: string | null;
  code_postal: string | null;
  libelle_commune: string | null;
  est_siege: boolean;
};

type UniteLegale = {
  siren: string;
  nom_raison_sociale: string | null;
  nom_complet: string | null;
  etat_administratif: string;
  matching_etablissements: Etablissement[];
};

type ApiResponse = {
  results: UniteLegale[];
  total_results: number;
};

// ============================================
// Stats
// ============================================

let totalVerified = 0;
let totalClosed = 0;
let totalErrors = 0;
let totalRelocations = 0;

// ============================================
// Helpers
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeSiret(siret: string): string {
  return siret.replace(/\s/g, "");
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================
// Vérification d'un SIRET via l'API
// ============================================

async function checkSiret(
  siret: string
): Promise<{
  status: "active" | "closed" | "not_found" | "error";
  relocation?: { newSiret: string; address: string; city: string };
}> {
  const normalized = normalizeSiret(siret);

  try {
    const res = await fetchWithTimeout(
      `${API_BASE}?q=${normalized}&mtm_campaign=workwave-cleanup`
    );

    if (!res.ok) {
      if (res.status === 429) {
        // Rate limited — attendre et réessayer une fois
        await sleep(2000);
        const retry = await fetchWithTimeout(
          `${API_BASE}?q=${normalized}&mtm_campaign=workwave-cleanup`
        );
        if (!retry.ok) return { status: "error" };
        const retryData = (await retry.json()) as ApiResponse;
        return analyzeResponse(retryData, normalized);
      }
      return { status: "error" };
    }

    const data = (await res.json()) as ApiResponse;
    return analyzeResponse(data, normalized);
  } catch {
    return { status: "error" };
  }
}

function analyzeResponse(
  data: ApiResponse,
  normalizedSiret: string
): {
  status: "active" | "closed" | "not_found" | "error";
  relocation?: { newSiret: string; address: string; city: string };
} {
  if (!data.results || data.results.length === 0) {
    return { status: "not_found" };
  }

  const siren = normalizedSiret.substring(0, 9);

  // Chercher l'unité légale qui contient notre SIRET
  for (const ul of data.results) {
    if (!ul.matching_etablissements) continue;

    const matching = ul.matching_etablissements.find(
      (e) => normalizeSiret(e.siret) === normalizedSiret
    );

    if (!matching) continue;

    if (matching.etat_administratif === "F") {
      // Établissement fermé — chercher un déménagement dans la Vienne
      let relocation: { newSiret: string; address: string; city: string } | undefined;

      if (ul.siren === siren) {
        const activeInVienne = ul.matching_etablissements.find(
          (e) =>
            normalizeSiret(e.siret) !== normalizedSiret &&
            e.etat_administratif === "A" &&
            e.code_postal?.startsWith("86")
        );

        if (activeInVienne) {
          relocation = {
            newSiret: activeInVienne.siret,
            address: activeInVienne.adresse || "Adresse inconnue",
            city: activeInVienne.libelle_commune || "Ville inconnue",
          };
        }
      }

      return { status: "closed", relocation };
    }

    // Établissement actif
    return { status: "active" };
  }

  // SIRET pas trouvé dans les résultats — requête large, pas de match exact
  return { status: "not_found" };
}

// ============================================
// Programme principal
// ============================================

async function main() {
  console.log("=== Nettoyage des établissements fermés ===\n");

  // Compter le total
  const { count } = await supabase
    .from("pros")
    .select("id", { count: "exact", head: true })
    .not("siret", "is", null)
    .or("is_active.is.null,is_active.eq.true");

  const total = count || 0;
  console.log(`${total} pros à vérifier\n`);

  if (total === 0) {
    console.log("Rien à faire.");
    return;
  }

  let offset = 0;
  let batchClosed = 0;

  while (offset < total) {
    // Charger un batch
    const { data: pros, error } = await supabase
      .from("pros")
      .select("id, name, siret")
      .not("siret", "is", null)
      .or("is_active.is.null,is_active.eq.true")
      .order("id")
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error(`Erreur chargement batch offset ${offset}:`, error.message);
      offset += BATCH_SIZE;
      continue;
    }

    if (!pros || pros.length === 0) break;

    batchClosed = 0;

    for (const pro of pros) {
      if (!pro.siret) continue;

      const result = await checkSiret(pro.siret);
      totalVerified++;

      switch (result.status) {
        case "closed": {
          totalClosed++;
          batchClosed++;

          // Marquer comme inactif
          await supabase
            .from("pros")
            .update({ is_active: false })
            .eq("id", pro.id);

          console.log(`  FERMÉ : ${pro.name} (SIRET ${pro.siret})`);

          if (result.relocation) {
            totalRelocations++;
            console.log(
              `  DÉMÉNAGEMENT DÉTECTÉ : ${pro.name} — ancien SIRET ${pro.siret} fermé, nouveau SIRET ${result.relocation.newSiret} actif à ${result.relocation.address}, ${result.relocation.city}`
            );
          }
          break;
        }
        case "active":
          // Confirmer explicitement comme actif
          await supabase
            .from("pros")
            .update({ is_active: true })
            .eq("id", pro.id);
          break;
        case "not_found":
          // Pas trouvé dans l'API — on ne touche pas
          break;
        case "error":
          totalErrors++;
          console.log(`  ERREUR API : ${pro.name} (SIRET ${pro.siret})`);
          break;
      }

      // Rate limiting
      await sleep(DELAY_MS);
    }

    offset += pros.length;
    console.log(
      `Traité ${Math.min(offset, total)}/${total} — ${batchClosed} fermés dans ce lot (${totalClosed} total)`
    );
  }

  // Résumé final
  console.log("\n=== Résumé ===");
  console.log(`Pros vérifiés    : ${totalVerified}`);
  console.log(`Fermés trouvés   : ${totalClosed}`);
  console.log(`Déménagements    : ${totalRelocations}`);
  console.log(`Erreurs API      : ${totalErrors}`);
  console.log(`Toujours actifs  : ${totalVerified - totalClosed - totalErrors}`);
}

main().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
