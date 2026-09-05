import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const PARIS = 12133;
const NAFS = ["4332B","4329B","4322B","4334Z"];
async function main() {
  for (const naf of NAFS) {
    const { count, error } = await sb.from("pros").select("id",{count:"exact",head:true})
      .eq("naf_code", naf).eq("city_id", PARIS).eq("is_active", true).is("deleted_at", null)
      .or("etat_admin.is.null,etat_admin.neq.F");
    if (error) throw error; if (count === null) throw new Error("count NULL " + naf);
    // repartition par categorie
    const { data: cats } = await sb.from("categories").select("id, slug").in("vertical",["btp","domicile","personne"]);
    const detail: string[] = [];
    for (const c of (cats as any[])) {
      const { count: n } = await sb.from("pros").select("id",{count:"exact",head:true})
        .eq("naf_code", naf).eq("city_id", PARIS).eq("category_id", c.id)
        .eq("is_active", true).is("deleted_at", null).or("etat_admin.is.null,etat_admin.neq.F");
      if (n && n > 0) detail.push(`${c.slug}=${n}`);
    }
    console.log(`NAF ${naf} Paris : ${count} fiches ouvertes en base  ->  ${detail.join("  ")}`);
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message||e);process.exit(1);});
