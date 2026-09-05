/** REFUTATION : re-mesure independante de la couverture commune_data. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });

const COLS = ["prix_m2_moyen","revenu_median","taux_vacance","densite_hab_km2",
  "logements_autorises","logements_commences","sitadel_annee","niveau_equipements","grille_densite",
  "nb_mutations","dvf_annee","filosofi_annee","lovac_annee","logements_vacants"];

(async () => {
  // 1. commune_data : nombre de lignes + taux de remplissage, mesure a moi
  const { count: tot } = await sb.from("commune_data").select("insee_code", { count: "exact", head: true });
  console.log(`commune_data : ${tot} lignes`);
  const fill: Record<string, number> = {}; COLS.forEach(c => fill[c] = 0);
  const faits = new Map<string, {prix:boolean;rev:boolean;vac:boolean;dens:boolean}>();
  let n = 0, off = 0;
  while (true) {
    const { data, error } = await sb.from("commune_data").select(["insee_code", ...COLS].join(",")).range(off, off + 999);
    if (error) { console.error("ERR", error.message); process.exit(1); }
    const r = (data || []) as any[]; if (!r.length) break;
    for (const row of r) {
      n++;
      for (const c of COLS) if (row[c] !== null && row[c] !== undefined) fill[c]++;
      faits.set(row.insee_code, {
        prix: row.prix_m2_moyen != null, rev: row.revenu_median != null,
        vac: row.taux_vacance != null, dens: row.densite_hab_km2 != null });
    }
    off += r.length;
  }
  console.log(`lues : ${n}`);
  for (const c of COLS) console.log(`  ${((fill[c]/n)*100).toFixed(1).padStart(6)} %  ${c}  (${fill[c]})`);

  // 2. cities : id -> insee, pays
  const insee = new Map<number, string>(); const pays = new Map<number, string>();
  let o = 0, nbCities = 0, sansInsee = 0;
  while (true) {
    const { data } = await sb.from("cities").select("id,insee_code,country").range(o, o + 999);
    const r = (data || []) as any[]; if (!r.length) break;
    for (const c of r) { nbCities++; pays.set(c.id, c.country || "FR");
      if (c.insee_code) insee.set(c.id, c.insee_code); else sansInsee++; }
    o += r.length;
  }
  console.log(`\ncities : ${nbCities} lignes, dont ${sansInsee} sans insee_code`);

  // 3. couples metier x ville OUVERTS via la RPC du sitemap (p_min = 1)
  const parVille = new Map<number, number>();
  let couplesTot = 0, couplesPrix = 0, couplesRev = 0, couplesUnFait = 0, couplesDensSeule = 0;
  let offset = 0;
  while (true) {
    const { data, error } = await sb.rpc("sitemap_city_cat_page", { p_offset: offset, p_limit: 5000, p_min: 1 });
    if (error) { console.error("RPC ERR", error.message); process.exit(1); }
    const rows = (data || []) as {c:number;v:number;n:number}[];
    if (!rows.length) break;
    for (const row of rows) {
      couplesTot++;
      parVille.set(row.v, (parVille.get(row.v) || 0) + Number(row.n));
      const ic = insee.get(row.v); const f = ic ? faits.get(ic) : undefined;
      if (f) {
        if (f.prix || f.rev || f.vac || f.dens) couplesUnFait++;
        if (f.prix) couplesPrix++;
        if (f.rev) couplesRev++;
        if (f.dens && !f.prix && !f.rev && !f.vac) couplesDensSeule++;
      }
    }
    offset += rows.length;
    if (offset % 50000 === 0) console.error(`  ...${offset} couples`);
  }
  console.log(`\ncouples metier x commune (>=1 pro OUVERT) : ${couplesTot}`);
  console.log(`  au moins un fait local : ${couplesUnFait} (${((couplesUnFait/couplesTot)*100).toFixed(1)} %)`);
  console.log(`  prix au m2            : ${couplesPrix} (${((couplesPrix/couplesTot)*100).toFixed(1)} %)`);
  console.log(`  revenu median         : ${couplesRev} (${((couplesRev/couplesTot)*100).toFixed(1)} %)`);
  console.log(`  DENSITE SEULE (aucun autre fait) : ${couplesDensSeule} (${((couplesDensSeule/couplesTot)*100).toFixed(1)} %)`);

  // 4. fiches ouvertes couvertes
  let fTot = 0, fUnFait = 0, fPrix = 0, fRev = 0, fDensSeule = 0;
  for (const [v, nn] of parVille) {
    fTot += nn;
    const ic = insee.get(v); const f = ic ? faits.get(ic) : undefined;
    if (!f) continue;
    if (f.prix || f.rev || f.vac || f.dens) fUnFait += nn;
    if (f.prix) fPrix += nn;
    if (f.rev) fRev += nn;
    if (f.dens && !f.prix && !f.rev && !f.vac) fDensSeule += nn;
  }
  console.log(`\nfiches pros OUVERTES (somme RPC) : ${fTot}  sur ${parVille.size} communes`);
  console.log(`  au moins un fait : ${fUnFait} (${((fUnFait/fTot)*100).toFixed(1)} %)`);
  console.log(`  prix au m2       : ${fPrix} (${((fPrix/fTot)*100).toFixed(1)} %)`);
  console.log(`  revenu median    : ${fRev} (${((fRev/fTot)*100).toFixed(1)} %)`);
  console.log(`  densite seule    : ${fDensSeule} (${((fDensSeule/fTot)*100).toFixed(1)} %)`);
})();
