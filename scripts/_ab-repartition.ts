/**
 * Repartition A/B des prospects, EQUILIBREE et REPRODUCTIBLE.
 *
 * POURQUOI PAS UN TIRAGE AU HASARD SIMPLE : sur 223 adresses dont 208 sont des
 * chauffagistes belges, un tirage naif peut mettre 15 Francais d'un cote et 4 de
 * l'autre. L'ecart mesure refleterait alors le pays, pas le modele de mail.
 * On alterne donc A/B a l'interieur de chaque groupe (pays x metier), ce qui
 * garantit des groupes comparables.
 *
 * AUCUN ENVOI ICI. Ce script prepare et affiche, rien d'autre.
 */
import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
type L = Record<string, string>;
const rows: L[] = JSON.parse(fs.readFileSync("/tmp/prep.json", "utf8"));

(async () => {
  const envoyables: string[] = JSON.parse(fs.readFileSync("/tmp/envoyables.json", "utf8"));
  const ok = new Set(envoyables.map((e) => e.toLowerCase()));

  // une seule ligne par adresse : jamais deux mails a la meme boite
  const parAdresse = new Map<string, L>();
  for (const r of rows) {
    const e = (r.email || "").toLowerCase();
    if (!e || !ok.has(e) || parAdresse.has(e)) continue;
    parAdresse.set(e, r);
  }
  const liste = [...parAdresse.values()];
  console.log(`adresses uniques envoyables : ${liste.length}`);

  // strate = pays + metier
  const belge = (r: L) => /\(\d{4}\)/.test(r.ville);
  const strate = (r: L) => `${belge(r) ? "BE" : "FR"}|${r.metier}`;
  const groupes = new Map<string, L[]>();
  liste.forEach((r) => groupes.set(strate(r), [...(groupes.get(strate(r)) || []), r]));

  const A: L[] = [], B: L[] = [];
  for (const [, g] of [...groupes.entries()].sort()) {
    g.sort((x, y) => x.email.localeCompare(y.email)); // ordre stable, resultat reproductible
    g.forEach((r, i) => (i % 2 === 0 ? A : B).push(r));
  }

  console.log(`\ngroupe A : ${A.length}   groupe B : ${B.length}`);
  console.log(`\nequilibre par strate :`);
  console.log(`strate                          A     B`);
  for (const [s, g] of [...groupes.entries()].sort()) {
    const a = A.filter((r) => strate(r) === s).length, b = B.filter((r) => strate(r) === s).length;
    console.log(`${s.slice(0, 30).padEnd(32)}${String(a).padStart(3)}   ${String(b).padStart(3)}   (${g.length})`);
  }

  // rattachement a la fiche en base, par SLUG (jamais par nom : homonymes)
  const slugs = liste.map((r) => (r.fiche_workwave || "").split("/artisan/")[1]).filter(Boolean);
  const { data: pros, error } = await sb.from("pros").select("id, slug, name, claimed_at").in("slug", slugs);
  if (error) { console.error("ERREUR:", error.message); process.exit(1); }
  const parSlug = new Map((pros || []).map((p: any) => [p.slug, p]));
  const sansFiche = liste.filter((r) => !parSlug.get((r.fiche_workwave || "").split("/artisan/")[1]));
  const dejaReclamees = (pros || []).filter((p: any) => p.claimed_at).length;
  console.log(`\nfiches retrouvees en base : ${(pros || []).length} / ${liste.length}`);
  console.log(`  sans fiche rattachable  : ${sansFiche.length}  (a exclure de l'envoi)`);
  console.log(`  deja reclamees          : ${dejaReclamees}  (a exclure aussi)`);

  const final = liste.filter((r) => {
    const p = parSlug.get((r.fiche_workwave || "").split("/artisan/")[1]);
    return p && !p.claimed_at;
  });
  const fA = final.filter((r) => A.includes(r)), fB = final.filter((r) => B.includes(r));
  console.log(`\nENVOI FINAL : ${final.length} adresses  ->  A ${fA.length} / B ${fB.length}`);

  const sortie = final.map((r) => {
    const p: any = parSlug.get((r.fiche_workwave || "").split("/artisan/")[1]);
    return { pro_id: p.id, slug: p.slug, entreprise: p.name, email: r.email,
             metier: r.metier, ville: r.ville, pays: belge(r) ? "BE" : "FR",
             variante: A.includes(r) ? "A" : "B" };
  });
  fs.writeFileSync("/tmp/ab-envoi.json", JSON.stringify(sortie, null, 2));
  console.log(`\nprepare dans /tmp/ab-envoi.json (aucun mail envoye)`);

  // puissance reelle du test
  const n = Math.min(fA.length, fB.length);
  console.log(`\n--- ce que ce test peut detecter ---`);
  for (const [base, ecart] of [[0.02, 0.02], [0.02, 0.04], [0.05, 0.05]] as [number, number][]) {
    const p1 = base, p2 = base + ecart, pb = (p1 + p2) / 2;
    const nNec = Math.ceil(2 * Math.pow(1.96 + 0.84, 2) * pb * (1 - pb) / Math.pow(p2 - p1, 2));
    console.log(`  distinguer ${(p1*100).toFixed(0)} % de ${(p2*100).toFixed(0)} % demanderait ${nNec} adresses par groupe (on en a ${n})`);
  }
})();
