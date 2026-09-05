/** CONTRE-MESURE 2 :
 *  A) si on levait le verrou, combien de fiches produiraient VRAIMENT la phrase
 *     « Elle n a pas de salarie d apres l INSEE » ?
 *  B) le NAF, DEJA affiche sans verrou, combien de voisins partagent le libelle ?
 *  C) la donnee gratuite est-elle « epuisee » ? -> pouvoir de distinction des
 *     colonnes de l enrichissement annuaire, mesure sur le pilote enrichi. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import { formatEffectifRange } from "../lib/utils/sirene";
import { libelleNaf } from "../lib/data/naf-labels";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });

(async () => {
  // --- A + B : echantillon reparti de fiches ouvertes
  const MAXID = 4_600_000, T = 40; let n = 0;
  let effAucun = 0, effAutre = 0, effRien = 0, nafRendu = 0, nafVide = 0;
  const groupes = new Map<string, any[]>();
  for (let t = 0; t < T; t++) {
    const { data } = await sb.from("pros")
      .select("id,city_id,category_id,effectif_range,naf_code,sirene_enrichi_at")
      .eq("is_active", true).is("deleted_at", null).or("etat_admin.is.null,etat_admin.neq.F")
      .gt("id", Math.floor((MAXID / T) * t)).order("id").limit(250);
    for (const r of (data || []) as any[]) {
      n++;
      const lab = formatEffectifRange(r.effectif_range);
      if (!lab) effRien++; else if (lab.startsWith("0 ")) effAucun++; else effAutre++;
      const nl = libelleNaf(r.naf_code);
      if (nl) nafRendu++; else nafVide++;
      const g = `${r.city_id}|${r.category_id}`;
      if (!groupes.has(g)) groupes.set(g, []); groupes.get(g)!.push({ ...r, nl });
    }
  }
  const pct = (x: number) => ((x / n) * 100).toFixed(1) + " %";
  console.log(`echantillon fiches OUVERTES : ${n}`);
  console.log(`\nA) SI le verrou sirene_enrichi_at etait leve, la prose effectif donnerait :`);
  console.log(`   ${pct(effRien).padStart(7)}  AUCUNE phrase (code NN ou vide : pas de libelle)`);
  console.log(`   ${pct(effAucun).padStart(7)}  « Elle n'a pas de salarie d'apres l'INSEE »  <-- la phrase redoutee`);
  console.log(`   ${pct(effAutre).padStart(7)}  « Elle compte X salaries » (14 libelles distincts)`);
  const OUVERTES = 1_233_038;
  console.log(`   extrapole sur ${OUVERTES.toLocaleString("fr-FR")} fiches ouvertes :`);
  console.log(`      phrase « pas de salarie » : ${Math.round((effAucun / n) * OUVERTES).toLocaleString("fr-FR")} fiches`);

  console.log(`\nB) NAF, DEJA affiche sans aucun verrou (page.tsx) :`);
  console.log(`   ${pct(nafRendu)} des fiches ouvertes affichent la carte « Activite declaree »`);
  const gros = [...groupes.entries()].filter(([, a]) => a.length >= 20);
  let partages = 0, totalG = 0;
  for (const [, arr] of gros) {
    const f = new Map<string, number>();
    arr.forEach((r) => { if (r.nl) f.set(r.nl, (f.get(r.nl) || 0) + 1); });
    const top = [...f.values()].sort((a, b) => b - a)[0] || 0;
    partages += top; totalG += arr.length;
  }
  console.log(`   sur ${gros.length} groupes de voisins (>=20 fiches, ${totalG} fiches) :`);
  console.log(`   ${((partages / totalG) * 100).toFixed(1)} % des voisins affichent le MEME libelle NAF que leur voisin le plus commun`);

  // --- C : le pilote enrichi
  const { count: nEnr } = await sb.from("pros").select("id", { count: "exact", head: true })
    .not("sirene_enrichi_at", "is", null);
  console.log(`\nC) fiches enrichies par l'annuaire : ${nEnr}`);
  const COLS = ["prenom_dirigeant","nom_dirigeant","enseignes","nom_commercial","finances",
    "nombre_etablissements","categorie_entreprise","labels_officiels","caractere_employeur","effectif_range"];
  const { data: enr } = await sb.from("pros").select(COLS.join(",") + ",id")
    .not("sirene_enrichi_at", "is", null).limit(1000);
  const arr = (enr || []) as any[];
  const rempli = (v: any) => v !== null && v !== undefined &&
    !(Array.isArray(v) && v.length === 0) && !(typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) &&
    !(typeof v === "string" && v.trim() === "");
  console.log(`   sur ${arr.length} fiches enrichies, remplissage et valeurs distinctes :`);
  for (const c of COLS) {
    const vals = arr.filter((r) => rempli(r[c])).map((r) => JSON.stringify(r[c]));
    const d = new Set(vals).size;
    console.log(`   ${String(((vals.length / arr.length) * 100).toFixed(0) + "%").padStart(5)} rempli · ${String(d).padStart(4)} valeurs distinctes  ${c}`);
  }
})();
