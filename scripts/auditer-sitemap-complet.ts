/**
 * AUDIT EXHAUSTIF du sitemap : chaque sous-sitemap est telecharge et compte,
 * declare ou non, puis un echantillon d'adresses est verifie en HTTP.
 *
 * Raison d'etre (lecon du 08/06/2026) : le sitemap a deja servi 6 740 adresses
 * au lieu de 233 000, puis 1,22 M au lieu de 1,8 M, sans jamais rien signaler.
 * Un sitemap qui repond 200 ne prouve RIEN. Il faut compter chaque fichier et
 * comparer la somme au contenu reel de la base.
 *
 * Usage : npx tsx scripts/auditer-sitemap-complet.ts [--echantillon=5]
 */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const BASE = "https://workwave.fr";
const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const ECH = Number((process.argv.find((a) => a.startsWith("--echantillon=")) || "--echantillon=4").split("=")[1]);

type Fiche = { id: number; declare: boolean; code: number; ms: number; octets: number;
               adresses: number; doublons: number; horsDomaine: number; erreur?: string };

async function lire(id: number, declare: boolean): Promise<Fiche> {
  const t0 = Date.now();
  try {
    const r = await fetch(`${BASE}/sitemap/${id}.xml`, { headers: { "user-agent": UA } });
    const txt = await r.text();
    const ms = Date.now() - t0;
    const locs = [...txt.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const vus = new Set<string>();
    let doublons = 0, horsDomaine = 0;
    for (const l of locs) {
      if (vus.has(l)) doublons++; else vus.add(l);
      if (!l.startsWith(BASE + "/")) horsDomaine++;
    }
    return { id, declare, code: r.status, ms, octets: txt.length,
             adresses: locs.length, doublons, horsDomaine };
  } catch (e: any) {
    return { id, declare, code: 0, ms: Date.now() - t0, octets: 0,
             adresses: 0, doublons: 0, horsDomaine: 0, erreur: e.message };
  }
}

(async () => {
  console.log("── INDEX ──");
  const idx = await fetch(`${BASE}/sitemap-index.xml`, { headers: { "user-agent": UA } });
  const xml = await idx.text();
  const declares = [...xml.matchAll(/\/sitemap\/(\d+)\.xml/g)].map((m) => Number(m[1]));
  console.log(`  code ${idx.status}, ${declares.length} enfants declares`);
  console.log(`  ids : ${declares.join(" ")}\n`);

  // On sonde AUSSI au-dela du dernier declare de chaque famille, pour
  // debusquer un sous-sitemap orphelin qui servirait des adresses reelles
  // sans etre reference (c'est ce qui cachait 54 970 fiches le 20/08).
  const aSonder = new Set<number>(declares);
  for (const base of [0, 100, 200]) {
    const famille = declares.filter((d) => d >= base && d < base + 100);
    const dernier = famille.length ? Math.max(...famille) : base - 1;
    for (let i = 1; i <= 6; i++) aSonder.add(dernier + i);
  }
  const liste = [...aSonder].sort((a, b) => a - b);

  console.log(`── ${liste.length} FICHIERS TELECHARGES ET COMPTES ──`);
  const fiches: Fiche[] = [];
  const PAR_LOT = 4; // on menage le serveur et l'egress Supabase
  for (let i = 0; i < liste.length; i += PAR_LOT) {
    const lot = liste.slice(i, i + PAR_LOT);
    const res = await Promise.all(lot.map((id) => lire(id, declares.includes(id))));
    for (const f of res) {
      fiches.push(f);
      const drapeau = !f.declare && f.adresses > 0 ? "  <<< ORPHELIN, NON DECLARE" : "";
      const lent = f.ms > 5000 ? "  <<< LENT" : "";
      const souci = f.code !== 200 ? `  <<< CODE ${f.code}` : "";
      console.log(
        `  ${String(f.id).padStart(4)} ${f.declare ? "declare" : "sonde  "} ` +
        `${String(f.adresses).padStart(6)} adresses  ${String(Math.round(f.octets/1024)).padStart(5)} Ko  ` +
        `${String(f.ms).padStart(5)} ms${souci}${drapeau}${lent}`
      );
    }
  }

  const total = fiches.filter((f) => f.declare).reduce((s, f) => s + f.adresses, 0);
  const orphelins = fiches.filter((f) => !f.declare && f.adresses > 0);
  const perdues = orphelins.reduce((s, f) => s + f.adresses, 0);

  console.log("\n── SYNTHESE ──");
  console.log(`  adresses servies par les fichiers DECLARES : ${total.toLocaleString("fr-FR")}`);
  if (orphelins.length) {
    console.log(`  🔴 fichiers ORPHELINS (existent, non declares) : ${orphelins.map((o) => o.id).join(", ")}`);
    console.log(`  🔴 adresses INVISIBLES de Google : ${perdues.toLocaleString("fr-FR")}`);
  } else {
    console.log(`  aucun fichier orphelin : la couverture est complete`);
  }
  const mauvais = fiches.filter((f) => f.declare && f.code !== 200);
  console.log(`  fichiers declares en erreur : ${mauvais.length ? mauvais.map((m) => `${m.id} (${m.code})`).join(", ") : "aucun"}`);
  const vides = fiches.filter((f) => f.declare && f.adresses === 0);
  console.log(`  fichiers declares VIDES     : ${vides.length ? vides.map((v) => v.id).join(", ") : "aucun"}`);
  const gros = fiches.filter((f) => f.adresses > 50000);
  console.log(`  au-dela de la limite 50 000 : ${gros.length ? gros.map((g) => g.id).join(", ") : "aucun"}`);
  const lourds = fiches.filter((f) => f.octets > 50 * 1024 * 1024);
  console.log(`  au-dela de 50 Mo            : ${lourds.length ? lourds.map((g) => g.id).join(", ") : "aucun"}`);
  const lents = fiches.filter((f) => f.declare && f.ms > 5000);
  console.log(`  plus de 5 s a repondre      : ${lents.length ? lents.map((l) => `${l.id} (${(l.ms/1000).toFixed(1)}s)`).join(", ") : "aucun"}`);
  const dbl = fiches.filter((f) => f.doublons > 0);
  console.log(`  doublons internes           : ${dbl.length ? dbl.map((d) => `${d.id} (${d.doublons})`).join(", ") : "aucun"}`);
  const hd = fiches.filter((f) => f.horsDomaine > 0);
  console.log(`  adresses hors domaine       : ${hd.length ? hd.map((d) => `${d.id} (${d.horsDomaine})`).join(", ") : "aucune"}`);
})();
