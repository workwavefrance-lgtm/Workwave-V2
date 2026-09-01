/**
 * Ping quotidien de l'API Google Indexing sur les ~195 pages a plus forte
 * valeur, a l'echelle NATIONALE. Remplace ping-google-indexing-listings.ts,
 * fige sur le perimetre Vienne + Nouvelle-Aquitaine de mai 2026 (43 villes,
 * et il pingait une categorie tech qui REDIRIGE, interdit par la lecon 06/06).
 *
 * Cibles, par ordre de valeur :
 *   1. la home + les hubs (deposer-projet, guide-des-prix, pro) ;
 *   2. les ~25 pages /trouver-des-chantiers/[metier] (machines a attraction) ;
 *   3. les listings [metier] x [grande ville] : top metiers BTP x top villes
 *      par population, lus en base.
 *
 * 🔴 PRE-VOL OBLIGATOIRE (lecon 06/06) : chaque URL est verifiee en HTTP 200
 * AVANT le ping. Une URL en redirection ou en erreur n'est JAMAIS pingee :
 * pinger une 308 marque la page "avec redirection" chez Google sans indexer
 * la cible. Quota API : ~200 URLs/jour, reset a minuit.
 *
 * Auth : ADC gcloud (scope indexing), cf. scripts/ping-google-indexing.ts et
 * la lecon du 29/04 (relancer `gcloud auth application-default login
 * --scopes=.../indexing,.../cloud-platform` si "insufficient scopes").
 *
 * Usage : npx tsx scripts/ping-quotidien.ts [--dry-run]
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry-run");
const BASE = "https://workwave.fr";
const QUOTA = 195;

// Metiers BTP a plus fort volume de recherche (tous verifies vertical=btp,
// donc jamais rediriges vers /ai).
const METIERS_PRIORITAIRES = [
  "plombier", "electricien", "macon", "peintre", "menuisier", "couvreur",
  "chauffagiste", "carreleur", "serrurier", "paysagiste", "plaquiste", "charpentier",
];

async function construireListe(): Promise<string[]> {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // 1. Hubs.
  const urls: string[] = [
    `${BASE}/`,
    `${BASE}/deposer-projet`,
    `${BASE}/guide-des-prix`,
    `${BASE}/pro`,
    `${BASE}/trouver-des-chantiers`,
  ];

  // 2. Les pages d'acquisition pro par metier (vertical btp uniquement).
  const { data: cats } = await sb
    .from("categories")
    .select("slug")
    .eq("vertical", "btp")
    .order("slug");
  for (const c of cats || []) urls.push(`${BASE}/trouver-des-chantiers/${c.slug}`);

  // 3. Listings metier x grande ville : top villes par population, national.
  const { data: villes } = await sb
    .from("cities")
    .select("slug, population")
    .not("population", "is", null)
    .order("population", { ascending: false })
    .limit(14);
  for (const v of villes || []) {
    for (const m of METIERS_PRIORITAIRES) {
      if (urls.length >= QUOTA) break;
      urls.push(`${BASE}/${m}/${v.slug}`);
    }
  }
  return urls.slice(0, QUOTA);
}

// Pre-vol : ne garder QUE les 200. HEAD sans suivre les redirections.
async function preVol(urls: string[]): Promise<string[]> {
  const ok: string[] = [];
  for (const u of urls) {
    try {
      const r = await fetch(u, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(20000) });
      if (r.status === 200) ok.push(u);
      else console.log(`  ECARTE (${r.status}) ${u}`);
    } catch {
      console.log(`  ECARTE (timeout) ${u}`);
    }
  }
  return ok;
}

async function main() {
  const liste = await construireListe();
  console.log(`${liste.length} URL candidates, pre-vol en cours...`);
  const valides = await preVol(liste);
  console.log(`${valides.length} URL en 200, ${liste.length - valides.length} ecartees`);

  if (DRY) {
    valides.slice(0, 12).forEach((u, i) => console.log(`  ${i + 1}. ${u}`));
    console.log("  ... (dry-run, rien n'est pinge)");
    return;
  }

  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
  google.options({ auth: (await auth.getClient()) as never });

  let envoyes = 0;
  for (const u of valides) {
    try {
      await google.indexing("v3").urlNotifications.publish({
        requestBody: { url: u, type: "URL_UPDATED" },
      });
      envoyes++;
    } catch (e) {
      const msg = (e as Error).message || "";
      if (msg.includes("Quota")) {
        console.log(`  quota atteint apres ${envoyes} pings, arret propre`);
        break;
      }
      console.log(`  echec ${u} : ${msg.slice(0, 80)}`);
    }
    // Rate limit API (~110 ms entre pings, pattern du script de reference).
    await new Promise((r) => setTimeout(r, 120));
  }
  console.log(`${envoyes} URL pingees sur ${valides.length}`);
}

main();
