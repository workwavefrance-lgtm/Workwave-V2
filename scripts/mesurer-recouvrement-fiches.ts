/**
 * Mesure le RECOUVREMENT DE TEXTE entre fiches voisines (meme metier, meme
 * commune). C'est la cause mesuree de notre non-indexation : le 17/08/2026,
 * deux artisans du meme metier dans la meme ville partageaient 80,4 % de leur
 * texte visible, et Google refuse d'indexer ce qu'il considere comme un
 * doublon.
 *
 * Methode : on telecharge les pages reellement servies, on extrait le texte
 * visible, et on compare chaque paire de voisins en sequences de 6 mots
 * (6-grammes). Un 6-gramme commun = six mots consecutifs identiques : c'est
 * la granularite a laquelle une reprise de phrase devient reperable.
 *
 * Usage :
 *   npx tsx scripts/mesurer-recouvrement-fiches.ts               (prod)
 *   npx tsx scripts/mesurer-recouvrement-fiches.ts --base=http://localhost:3000
 *   npx tsx scripts/mesurer-recouvrement-fiches.ts --paires=30
 */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });

const arg = (n: string, d: string) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split("=")[1];
const BASE = arg("base", "https://workwave.fr").replace(/\/$/, "");
const PAIRES = Number(arg("paires", "20"));

/** Texte visible d'une page : on retire scripts, styles et balises. */
function texteVisible(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function grammes(texte: string, n = 6): Set<string> {
  const mots = texte.split(" ").filter(Boolean);
  const s = new Set<string>();
  for (let i = 0; i + n <= mots.length; i++) s.add(mots.slice(i, i + n).join(" "));
  return s;
}

/** Part des 6-grammes de A que l'on retrouve aussi chez B, et inversement. */
function recouvrement(a: string, b: string): number | null {
  const ga = grammes(a), gb = grammes(b);
  if (ga.size < 50 || gb.size < 50) return null;
  let communs = 0;
  for (const g of ga) if (gb.has(g)) communs++;
  return (communs / Math.min(ga.size, gb.size)) * 100;
}

(async () => {
  console.log(`base : ${BASE}\ncible : ${PAIRES} paires de voisins\n`);

  // Des groupes ville x metier ou l'on a au moins deux fiches actives.
  const paires: { ville: string; metier: string; a: string; b: string }[] = [];
  const vus = new Set<string>();
  let depart = 0;

  while (paires.length < PAIRES && depart < 4_500_000) {
    const { data } = await sb.from("pros")
      .select("slug, city_id, category_id, city:cities(name), category:categories(name)")
      .eq("is_active", true).is("deleted_at", null)
      .gt("id", depart).limit(1000);
    const lot = (data || []) as any[];
    if (lot.length === 0) break;
    depart += 450_000;

    const groupes = new Map<string, any[]>();
    for (const p of lot) {
      const cle = `${p.city_id}|${p.category_id}`;
      const g = groupes.get(cle) || []; g.push(p); groupes.set(cle, g);
    }
    for (const [cle, g] of groupes) {
      if (g.length < 2 || vus.has(cle) || paires.length >= PAIRES) continue;
      vus.add(cle);
      paires.push({ ville: g[0].city?.name || "?", metier: g[0].category?.name || "?", a: g[0].slug, b: g[1].slug });
    }
  }

  // Fiches temoins : sans aucun rapport avec les paires (autre metier, autre
  // departement). Elles donnent le PLANCHER de gabarit du site.
  const { data: temoinsData } = await sb.from("pros")
    .select("slug, city_id, category_id")
    .eq("is_active", true).is("deleted_at", null).gt("id", 3_100_000).limit(40);
  const temoins = (temoinsData || []) as any[];

  const scores: number[] = [];
  const planchers: number[] = [];
  for (const p of paires) {
    try {
      const [ra, rb] = await Promise.all([
        fetch(`${BASE}/artisan/${p.a}`, { headers: { "user-agent": "Mozilla/5.0 (compatible; workwave-audit)" } }),
        fetch(`${BASE}/artisan/${p.b}`, { headers: { "user-agent": "Mozilla/5.0 (compatible; workwave-audit)" } }),
      ]);
      if (!ra.ok || !rb.ok) { console.log(`  ${p.metier} / ${p.ville} : ${ra.status} ${rb.status}, ignore`); continue; }
      const htmlA = await ra.text();
      const r = recouvrement(texteVisible(htmlA), texteVisible(await rb.text()));
      if (r === null) { console.log(`  ${p.metier} / ${p.ville} : page trop courte, ignore`); continue; }
      scores.push(r);

      // Meme fiche A, comparee a un temoin etranger.
      const t = temoins[scores.length % temoins.length];
      let pl = "";
      if (t && t.slug !== p.a) {
        const rt = await fetch(`${BASE}/artisan/${t.slug}`, { headers: { "user-agent": "Mozilla/5.0 (compatible; workwave-audit)" } });
        if (rt.ok) {
          const rp = recouvrement(texteVisible(htmlA), texteVisible(await rt.text()));
          if (rp !== null) { planchers.push(rp); pl = `   (plancher ${rp.toFixed(1)} %)`; }
        }
      }
      console.log(`  ${r.toFixed(1).padStart(5)} %  ${p.metier} / ${p.ville}${pl}`);
    } catch (e: any) {
      console.log(`  ${p.metier} / ${p.ville} : ${e.message}`);
    }
  }

  if (scores.length === 0) { console.log("\naucune paire mesurable"); return; }
  scores.sort((x, y) => x - y);
  const moy = scores.reduce((s, x) => s + x, 0) / scores.length;
  console.log(`\npaires mesurees : ${scores.length}`);
  console.log(`recouvrement moyen  : ${moy.toFixed(1)} %`);
  console.log(`mediane             : ${scores[Math.floor(scores.length / 2)].toFixed(1)} %`);
  console.log(`pire paire          : ${scores[scores.length - 1].toFixed(1)} %`);
  if (planchers.length) {
    const mp = planchers.reduce((s2, x) => s2 + x, 0) / planchers.length;
    console.log(`\nplancher de gabarit : ${mp.toFixed(1)} %   (menu, pied de page, appels a l'action)`);
    console.log(`duplication IMPUTABLE au couple metier x ville : ${(moy - mp).toFixed(1)} points`);
  }
  console.log(`\nrepere : 80,4 % le 17/08/2026, avant enrichissement.`);
})();
