/** MESURE 12 : couverture de commune_data et donnees non exploitees. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const COLS = ["prix_m2_moyen","prix_moyen_bien","nb_mutations","surface_moy","prop_maison","dvf_annee",
 "revenu_median","revenu_q1","revenu_q3","part_menages_imposes","filosofi_annee",
 "logements_prive_total","logements_vacants","logements_vacants_2ans","taux_vacance","lovac_annee",
 "logements_autorises","logements_commences","sitadel_annee","niveau_equipements","grille_densite","densite_hab_km2"];
(async () => {
  const { count: tot } = await sb.from("commune_data").select("insee_code", { count: "exact", head: true });
  console.log(`lignes dans commune_data : ${tot}`);
  const compte: Record<string, number> = {}; COLS.forEach(c => compte[c] = 0);
  let n = 0, off = 0;
  while (true) {
    const { data } = await sb.from("commune_data").select(["insee_code", ...COLS].join(",")).range(off, off + 999);
    const r = (data || []) as any[]; if (!r.length) break;
    for (const row of r) { n++; for (const c of COLS) if (row[c] !== null && row[c] !== undefined) compte[c]++; }
    off += r.length;
  }
  console.log(`lignes lues : ${n}\n`);
  COLS.map(c => ({ c, p: (compte[c] / n) * 100 })).sort((a,b)=>b.p-a.p)
    .forEach(l => console.log(`${l.p.toFixed(1).padStart(6)} %  ${l.c}   (${compte[l.c]} communes)`));

  // Combien de COUPLES metier x commune servis pourraient recevoir ces faits ?
  const acc: [string, number][] = JSON.parse(fs.readFileSync("/tmp/catville.json", "utf8"));
  const insee = new Map<number, string>(); let o2 = 0;
  while (true) { const { data } = await sb.from("cities").select("id,insee_code,country").range(o2, o2 + 999);
    const r = (data || []) as any[]; if (!r.length) break;
    for (const c of r) if (c.country !== "BE" && c.insee_code) insee.set(c.id, c.insee_code); o2 += r.length; }
  const avecPrix = new Set<string>(); off = 0;
  while (true) { const { data } = await sb.from("commune_data").select("insee_code,prix_m2_moyen,revenu_median,taux_vacance,densite_hab_km2").range(off, off + 999);
    const r = (data || []) as any[]; if (!r.length) break;
    for (const row of r) if (row.prix_m2_moyen !== null || row.revenu_median !== null || row.taux_vacance !== null || row.densite_hab_km2 !== null) avecPrix.add(row.insee_code);
    off += r.length; }
  let couplesOk = 0, couplesTot = 0, villesOk = new Set<number>();
  for (const [k] of acc) { const v = Number(k.split("|")[1]); couplesTot++;
    const ic = insee.get(v); if (ic && avecPrix.has(ic)) { couplesOk++; villesOk.add(v); } }
  console.log(`\ncommunes ayant au moins un fait local (prix, revenu, vacance ou densite) : ${avecPrix.size}`);
  console.log(`couples metier x commune servis : ${couplesTot} · dont rattachables a un fait local : ${couplesOk} (${((couplesOk/couplesTot)*100).toFixed(1)} %)`);
  console.log(`communes distinctes concernees : ${villesOk.size}`);

  // Combien de FICHES pros ouvertes sont dans une commune couverte ?
  const parVille = new Map<number, number>();
  for (const [k, nn] of acc) { const v = Number(k.split("|")[1]); parVille.set(v, (parVille.get(v) || 0) + nn); }
  let fichesOk = 0, fichesTot = 0;
  for (const [v, nn] of parVille) { fichesTot += nn; const ic = insee.get(v); if (ic && avecPrix.has(ic)) fichesOk += nn; }
  console.log(`fiches pros OUVERTES : ${fichesTot} · dont dans une commune couverte : ${fichesOk} (${((fichesOk/fichesTot)*100).toFixed(1)} %)`);
})();
