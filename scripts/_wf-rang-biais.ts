import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  let off = 0; const rows: any[] = [];
  while (true) {
    const { data, error } = await sb.from("pros").select("id, slug, founding_date, founded_year, claimed_by_user_id")
      .not("sirene_enrichi_at", "is", null).range(off, off + 999).abortSignal(AbortSignal.timeout(120_000));
    if (error) { console.log("ERREUR", error.message); return; }
    if (!data || data.length === 0) break;
    rows.push(...data); off += data.length;
  }
  const avec = rows.filter(r => r.founding_date && r.founded_year);
  const ulPlusAncienne = avec.filter(r => Number(String(r.founding_date).slice(0,4)) < r.founded_year);
  const ulPlusRecente = avec.filter(r => Number(String(r.founding_date).slice(0,4)) > r.founded_year);
  console.log(`fiches enrichies avec les deux dates : ${avec.length}`);
  console.log(`  date entreprise (founding_date) ANTERIEURE a la date etablissement (founded_year) : ${ulPlusAncienne.length}`);
  console.log(`  posterieure : ${ulPlusRecente.length}`);
  const ecarts = ulPlusAncienne.map(r => r.founded_year - Number(String(r.founding_date).slice(0,4)));
  if (ecarts.length) {
    const moy = ecarts.reduce((a,b)=>a+b,0)/ecarts.length;
    console.log(`  ecart moyen sur ces ${ecarts.length} : ${moy.toFixed(1)} ans, max ${Math.max(...ecarts)}`);
  }
  console.log(`  non reclamees (donc rang calcule avec la date entreprise) : ${rows.filter(r=>!r.claimed_by_user_id).length}`);
})();
