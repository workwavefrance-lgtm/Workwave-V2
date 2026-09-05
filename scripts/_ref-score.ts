import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { computeProScore } from "../lib/queries/top-pros";
const sb = getServiceClient();
const OUVERT = "etat_admin.is.null,etat_admin.neq.F";
const COLS = "id,name,siret,city_id,category_id,founded_year,profile_completion,claimed_by_user_id,certifications,rge_certified,has_decennale,has_rc_pro,photos,description,google_rating,google_reviews_count,workwave_reviews_avg,workwave_reviews_count";

// echantillon reparti : on tire des tranches d'id espacees sur toute la table
async function main() {
  const { data: bornes } = await sb.from("pros").select("id").order("id",{ascending:false}).limit(1);
  const maxId = bornes![0].id as number;
  const rows: any[] = [];
  const NB_TRANCHES = 25;
  for (let t = 0; t < NB_TRANCHES; t++) {
    const from = Math.floor((maxId * t) / NB_TRANCHES);
    const { data, error } = await sb.from("pros").select(COLS)
      .gte("id", from).is("deleted_at", null).eq("is_active", true).or(OUVERT)
      .order("id", { ascending: true }).limit(1000);
    if (error) { console.error("ERR", error.message); continue; }
    rows.push(...(data ?? []));
  }
  console.log(`echantillon : ${rows.length} fiches OUVERTES, reparties en ${NB_TRANCHES} tranches d'id`);
  const anc = (p: any) => {
    const fy = p.founded_year;
    return fy && fy > 1900 && fy <= new Date().getFullYear() ? Math.min(new Date().getFullYear() - fy, 20) : 0;
  };
  let seulAnc = 0, scoreZero = 0, avecNote = 0, avecGoogle = 0, avecWW = 0, avecPhoto = 0, avecDesc = 0, claimed = 0, profil = 0, certifs = 0;
  const scores = new Map<number, number>();
  for (const p of rows) {
    const s = computeProScore(p as any);
    scores.set(s, (scores.get(s) ?? 0) + 1);
    if (s === anc(p)) seulAnc++;
    if (s === 0) scoreZero++;
    if ((p.google_rating ?? 0) > 0) avecGoogle++;
    if ((p.workwave_reviews_count ?? 0) > 0) avecWW++;
    if ((p.google_rating ?? 0) > 0 || (p.workwave_reviews_count ?? 0) > 0) avecNote++;
    if ((p.photos ?? []).length > 0) avecPhoto++;
    if ((p.description ?? "").length > 0) avecDesc++;
    if (p.claimed_by_user_id) claimed++;
    if ((p.profile_completion ?? 0) > 0) profil++;
    if ((p.certifications ?? []).length > 0) certifs++;
  }
  const n = rows.length;
  const pc = (x: number) => `${x} (${(100*x/n).toFixed(2)}%)`;
  console.log(`  score = anciennete SEULE            : ${pc(seulAnc)}`);
  console.log(`  score = 0 (aucun signal du tout)    : ${pc(scoreZero)}`);
  console.log(`  valeurs de score distinctes         : ${scores.size}`);
  console.log(`  avec une note (Google ou Workwave)  : ${pc(avecNote)}   [google ${avecGoogle}, workwave ${avecWW}]`);
  console.log(`  avec au moins 1 photo               : ${pc(avecPhoto)}`);
  console.log(`  avec une description                : ${pc(avecDesc)}`);
  console.log(`  fiche reclamee                      : ${pc(claimed)}`);
  console.log(`  profile_completion > 0              : ${pc(profil)}`);
  console.log(`  au moins 1 certification            : ${pc(certifs)}`);
  const top = [...scores.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);
  console.log(`  8 scores les plus frequents         : ${top.map(([s,c])=>`${s}:${c}`).join("  ")}`);
}
main().catch(e => console.error(e));
