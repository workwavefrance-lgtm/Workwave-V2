/**
 * IndexNow pour workwave.fr : Bing, DuckDuckGo, Ecosia, Yandex (pas Google).
 * Gratuit, sans quota pratique (10 000 URL par envoi), indexation en heures.
 *
 * Pourquoi (01/09/2026) : le quota Google Indexing est de ~200/jour. Bing et
 * ses partenaires représentent 5 à 7 % des recherches en France et indexent
 * IndexNow en quelques heures. Du trafic en plus pendant que Google prend son
 * temps. Même liste que scripts/ping-quotidien.ts, plus les fiches récemment
 * modifiées (lib/queries/fraicheur.ts).
 *
 * Preuve de propriété : public/<KEY>.txt, servi sur https://workwave.fr/<KEY>.txt
 * (le même fichier sert déjà workwaveai.co, cf. scripts/ping-indexnow-en.ts).
 *
 * Usage : npx tsx scripts/ping-indexnow-fr.ts [--dry-run]
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";

const KEY = "1e4335a37349c03f37afb1b3cf6a91d8";
const HOST = "workwave.fr";
const BASE = `https://${HOST}`;
const KEY_LOCATION = `${BASE}/${KEY}.txt`;
const DRY = process.argv.includes("--dry-run");
// --large : tous les metiers (btp/domicile/personne) x 300 villes, les 530 guides de
// prix, les pages trouver-des-clients. IndexNow accepte 10 000 URL par envoi et n'a
// pas de quota pratique : autant tout lui donner, une fois verifie en 200.
const LARGE = process.argv.includes("--large");

const METIERS = [
  "plombier", "electricien", "macon", "peintre", "menuisier", "couvreur",
  "chauffagiste", "carreleur", "serrurier", "paysagiste", "plaquiste", "charpentier",
];

async function construireListe(): Promise<string[]> {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const urls = new Set<string>([
    `${BASE}/`, `${BASE}/deposer-projet`, `${BASE}/guide-des-prix`, `${BASE}/pro`, `${BASE}/trouver-des-chantiers`,
  ]);

  const { data: cats } = await sb.from("categories").select("slug").eq("vertical", "btp");
  for (const c of cats || []) urls.add(`${BASE}/trouver-des-chantiers/${c.slug}`);

  const { data: villes } = await sb
    .from("cities").select("slug").not("population", "is", null)
    .order("population", { ascending: false }).limit(LARGE ? 300 : 40);
  let metiers: string[] = METIERS;
  if (LARGE) {
    const { data: toutes } = await sb.from("categories").select("slug").in("vertical", ["btp", "domicile", "personne"]);
    metiers = (toutes || []).map((c) => c.slug);
    const { data: guides } = await sb.from("price_guides").select("slug").limit(1000);
    for (const g of guides || []) urls.add(`${BASE}/guide-des-prix/${g.slug}`);
    for (const m of metiers) { urls.add(`${BASE}/${m}`); urls.add(`${BASE}/${m}/prix`); }
    const { data: clients } = await sb.from("categories").select("slug").in("vertical", ["domicile", "personne"]);
    for (const c of clients || []) urls.add(`${BASE}/trouver-des-clients/${c.slug}`);
  }
  for (const v of villes || []) for (const m of metiers) urls.add(`${BASE}/${m}/${v.slug}`);

  // Fiches modifiées ces 14 jours (cap PostgREST 1000).
  const depuis = new Date(Date.now() - 14 * 86400e3).toISOString();
  const { data: fiches } = await sb
    .from("pros").select("slug").eq("is_active", true).is("deleted_at", null)
    .gt("updated_at", depuis).order("updated_at", { ascending: false }).limit(1000);
  for (const f of fiches || []) urls.add(`${BASE}/artisan/${f.slug}`);

  return [...urls];
}

// Pré-vol : jamais d'URL en redirection ou en erreur (leçon 06/06).
async function preVol(urls: string[]): Promise<string[]> {
  const ok: string[] = [];
  let i = 0;
  // 8 en parallele : assez pour finir en quelques minutes, pas assez pour peser
  // sur le serveur (les aspirateurs font 47/s, on fait ~8/s).
  const file = [...urls];
  async function travailleur() {
    while (file.length) {
      const u = file.shift()!;
      i++;
      try {
        const r = await fetch(u, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(20000) });
        if (r.status === 200) ok.push(u);
      } catch { /* écartée */ }
      if (i % 1000 === 0) console.log(`  pré-vol ${i}/${urls.length}`);
    }
  }
  await Promise.all(Array.from({ length: 8 }, travailleur));
  return ok;
}

async function main() {
  const keyTest = await fetch(KEY_LOCATION);
  if (!keyTest.ok) {
    console.error(`Preuve de propriété ${KEY_LOCATION} = HTTP ${keyTest.status}, attendu 200. Arrêt.`);
    process.exit(1);
  }
  const liste = await construireListe();
  console.log(`${liste.length} URL candidates`);
  const valides = await preVol(liste);
  console.log(`${valides.length} en 200, ${liste.length - valides.length} écartées`);
  if (DRY) { console.log("  (dry-run, rien n'est envoyé)"); return; }

  for (let i = 0; i < valides.length; i += 5000) {
    const batch = valides.slice(i, i + 5000);
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: batch }),
    });
    console.log(`  lot ${i / 5000 + 1} : ${batch.length} URL -> HTTP ${res.status} ${res.status === 200 || res.status === 202 ? "(accepté)" : "(REFUSÉ)"}`);
  }
}

main();
