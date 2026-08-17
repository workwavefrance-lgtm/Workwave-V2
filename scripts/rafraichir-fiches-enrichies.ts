/**
 * ETAPE 4 DU PLAN DU 17/08 : faire voir a Google les fiches enrichies.
 *
 * Les fiches sont mises en cache 7 jours. Une fiche deja visitee garde donc
 * son ancienne version, sans l'activite declaree ni le bloc RGE, jusqu'a
 * expiration. Deux gestes, dans cet ordre :
 *   1. PURGER le cache de la fiche, sinon on demande a Google de venir
 *      regarder... l'ancienne page.
 *   2. DEMANDER L'INDEXATION via l'API Google (quota 200/jour, on en prend
 *      195 pour garder de la marge).
 *
 * PRIORITE : les fiches certifiees RGE d'abord, ce sont celles qui ont gagne
 * le plus de contenu qui leur est propre (intitule de la qualification,
 * organisme, date de validite), puis les plus grandes villes, la ou il y a
 * du trafic.
 *
 * IDEMPOTENT : ce qui a deja ete traite est note dans `events`
 * (event_name = 'fiche_reindex'), donc relancer le lendemain reprend la
 * suite au lieu de refaire les memes.
 *
 * Usage :
 *   npx tsx scripts/rafraichir-fiches-enrichies.ts            (simulation)
 *   npx tsx scripts/rafraichir-fiches-enrichies.ts --purger   (purge seule, sans quota)
 *   npx tsx scripts/rafraichir-fiches-enrichies.ts --tout     (purge + demande d'indexation)
 *
 * Scope OAuth necessaire pour l'indexation (cf. lecon du 29/04) :
 *   gcloud auth application-default login \
 *     --scopes="https://www.googleapis.com/auth/indexing,https://www.googleapis.com/auth/cloud-platform"
 */
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BASE = "https://workwave.fr";
const QUOTA_INDEXATION = 195; // le quota Google est de 200/jour, on garde 5 de marge
const PATHS_PAR_PURGE = 40; // l'endpoint accepte plusieurs ?path=, on evite l'URL trop longue
const PAUSE_PING_MS = 110; // rythme impose par l'API Google

const PURGER = process.argv.includes("--purger") || process.argv.includes("--tout");
const INDEXER = process.argv.includes("--tout");

type Fiche = { id: number; slug: string; pop: number };

/** Les fiches deja traitees, pour ne pas refaire le meme travail demain. */
async function dejaTraitees(): Promise<Set<number>> {
  const vus = new Set<number>();
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data } = await sb
      .from("events")
      .select("pro_id")
      .eq("event_name", "fiche_reindex")
      .range(offset, offset + PAGE - 1);
    const rows = data || [];
    if (rows.length === 0) break;
    for (const r of rows) if (r.pro_id != null) vus.add(r.pro_id);
    offset += rows.length;
  }
  return vus;
}

/** Fiches RGE, les plus peuplees d'abord : contenu neuf + trafic potentiel. */
async function fichesPrioritaires(exclues: Set<number>): Promise<Fiche[]> {
  const out: Fiche[] = [];
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await sb
      .from("pros")
      .select("id, slug, city:cities(population)")
      .eq("rge_certified", true)
      .eq("is_active", true)
      .is("deleted_at", null)
      .range(offset, offset + PAGE - 1);
    if (error) {
      console.error("ERREUR de lecture:", error.message);
      process.exit(1);
    }
    const rows = data || [];
    if (rows.length === 0) break;
    for (const r of rows) {
      if (exclues.has(r.id)) continue;
      out.push({ id: r.id, slug: r.slug, pop: (r as any).city?.population || 0 });
    }
    offset += rows.length;
  }
  out.sort((a, b) => b.pop - a.pop);
  return out;
}

async function purger(fiches: Fiche[], secret: string): Promise<number> {
  let ok = 0;
  for (let i = 0; i < fiches.length; i += PATHS_PAR_PURGE) {
    const lot = fiches.slice(i, i + PATHS_PAR_PURGE);
    const qs = lot.map((f) => `path=${encodeURIComponent(`/artisan/${f.slug}`)}`).join("&");
    try {
      const r = await fetch(`${BASE}/api/revalidate-sitemap?${qs}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (r.ok) ok += lot.length;
      else console.error(`  purge refusee (${r.status}) sur le lot ${i / PATHS_PAR_PURGE + 1}`);
    } catch (e) {
      console.error("  purge en echec:", (e as Error).message.slice(0, 80));
    }
    if ((i / PATHS_PAR_PURGE) % 25 === 0 && i > 0) console.log(`   ${ok} fiches purgees...`);
  }
  return ok;
}

async function demanderIndexation(fiches: Fiche[]): Promise<number> {
  const { google } = await import("googleapis");
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
  const client = await auth.getClient();
  const indexing = google.indexing({ version: "v3", auth: client as never });

  let ok = 0;
  for (const f of fiches) {
    const url = `${BASE}/artisan/${f.slug}`;
    try {
      // Controle de vol : ne JAMAIS demander l'indexation d'une URL qui
      // redirige (lecon du 06/06 : Google marque alors la source
      // "page avec redirection" et n'indexe pas la cible).
      const tete = await fetch(url, { method: "HEAD", redirect: "manual" });
      if (tete.status !== 200) {
        console.log(`   ignoree (${tete.status}) ${url}`);
        continue;
      }
      await indexing.urlNotifications.publish({
        requestBody: { url, type: "URL_UPDATED" },
      });
      await sb.from("events").insert({ event_name: "fiche_reindex", pro_id: f.id });
      ok++;
      if (ok % 25 === 0) console.log(`   ${ok}/${fiches.length} demandes envoyees`);
    } catch (e) {
      const m = (e as Error).message;
      console.error(`   echec sur ${f.slug} : ${m.slice(0, 90)}`);
      if (/quota|rate/i.test(m)) {
        console.log("   quota atteint, on s'arrete proprement.");
        break;
      }
    }
    await new Promise((r) => setTimeout(r, PAUSE_PING_MS));
  }
  return ok;
}

(async () => {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (PURGER && !secret) {
    console.error("CRON_SECRET absent de .env.local : purge impossible.");
    process.exit(1);
  }

  console.log("=== Rafraichissement des fiches enrichies ===\n");
  const vus = await dejaTraitees();
  console.log(`deja traitees lors des passages precedents : ${vus.size}`);

  const fiches = await fichesPrioritaires(vus);
  console.log(`fiches RGE restant a traiter               : ${fiches.length}`);
  if (fiches.length === 0) {
    console.log("\nRien a faire.");
    return;
  }
  console.log(`\nles 5 premieres (plus grandes villes d'abord) :`);
  for (const f of fiches.slice(0, 5)) console.log(`   ${String(f.pop).padStart(8)} hab · /artisan/${f.slug}`);

  if (!PURGER) {
    console.log(`\nSIMULATION.`);
    console.log(`  --purger  purge le cache des ${fiches.length} fiches (sans quota)`);
    console.log(`  --tout    purge puis demande l'indexation des ${Math.min(QUOTA_INDEXATION, fiches.length)} premieres`);
    return;
  }

  console.log(`\n1. Purge du cache des ${fiches.length} fiches...`);
  const purgees = await purger(fiches, secret);
  console.log(`   ${purgees} fiches purgees.`);

  if (!INDEXER) {
    console.log("\nPurge seule terminee. Relancer avec --tout pour demander l'indexation.");
    return;
  }

  const lot = fiches.slice(0, QUOTA_INDEXATION);
  console.log(`\n2. Demande d'indexation des ${lot.length} premieres (quota du jour)...`);
  const envoyees = await demanderIndexation(lot);
  console.log(`   ${envoyees} demandes acceptees.`);
  console.log(`\nRestera pour les prochains jours : ${fiches.length - envoyees}`);
})();
