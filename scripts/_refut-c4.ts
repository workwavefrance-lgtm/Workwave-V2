import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  // type reel renvoye par la RPC
  const { data } = await sb.rpc("sitemap_city_cat_page", { p_offset: 0, p_limit: 2, p_min: 1 });
  console.log("echantillon RPC :", JSON.stringify(data), "typeof v =", typeof (data as any[])[0].v);

  const insee = new Map<number,string>(), pays = new Map<number,string>();
  let o = 0; while (true) { const { data } = await sb.from("cities").select("id,insee_code,country").range(o,o+999);
    const r=(data||[]) as any[]; if(!r.length) break; for(const c of r){insee.set(c.id,c.insee_code);pays.set(c.id,c.country||"FR");} o+=r.length; }
  const faits = new Set<string>(); let sansFait = 0, off=0;
  while (true) { const { data } = await sb.from("commune_data").select("insee_code,prix_m2_moyen,revenu_median,taux_vacance,densite_hab_km2").range(off,off+999);
    const r=(data||[]) as any[]; if(!r.length) break;
    for(const x of r){ if(x.prix_m2_moyen!=null||x.revenu_median!=null||x.taux_vacance!=null||x.densite_hab_km2!=null) faits.add(x.insee_code); else sansFait++; }
    off+=r.length; }
  console.log(`commune_data avec >=1 fait : ${faits.size} · sans aucun fait : ${sansFait}`);

  // villes NON couvertes (liste courte) = pas de ligne, ou ligne sans fait, ou BE
  const nonCouvertes: number[] = [], nonCouvBE: number[] = [];
  for (const [id, ic] of insee) {
    if (pays.get(id) === "BE") { nonCouvBE.push(id); continue; }
    if (!faits.has(ic)) nonCouvertes.push(id);
  }
  console.log(`villes FR non couvertes : ${nonCouvertes.length} · villes BE : ${nonCouvBE.length}`);

  const OUVERT = (q: any) => q.eq("is_active", true).is("deleted_at", null).or("etat_admin.is.null,etat_admin.neq.F");
  const { count: totOuv, error: e1 } = await OUVERT(sb.from("pros").select("id", { count: "exact", head: true }));
  console.log(`pros OUVERTS total : ${totOuv} ${e1 ? "ERR "+e1.message : ""}`);
  const { count: sansVille } = await OUVERT(sb.from("pros").select("id", { count: "exact", head: true })).is("city_id", null);
  console.log(`  dont sans city_id : ${sansVille}`);
  let horsFR = 0;
  for (let i = 0; i < nonCouvBE.length; i += 200) {
    const { count } = await OUVERT(sb.from("pros").select("id", { count: "exact", head: true })).in("city_id", nonCouvBE.slice(i, i+200));
    horsFR += count || 0; }
  console.log(`  dont en Belgique : ${horsFR}`);
  let sansFaitN = 0;
  for (let i = 0; i < nonCouvertes.length; i += 200) {
    const { count } = await OUVERT(sb.from("pros").select("id", { count: "exact", head: true })).in("city_id", nonCouvertes.slice(i, i+200));
    sansFaitN += count || 0; }
  console.log(`  dont commune FR sans aucun fait : ${sansFaitN}`);
  const couv = (totOuv||0) - (sansVille||0) - horsFR - sansFaitN;
  console.log(`\nfiches OUVERTES rattachables a >=1 fait de commune : ${couv} / ${totOuv} = ${((couv/(totOuv||1))*100).toFixed(1)} %`);
})();
