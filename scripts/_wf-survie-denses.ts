import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const DENSES = ["76","67","38","35","95","78","77","94","92","83","06","34","31","44","59","33","69","13","75"];

async function main() {
  for (const [id, slug, naf] of [[11,"serrurier","4332B"],[13,"climaticien","4322B"]] as [number,string,string][]) {
    let offset = 0; const dansDenses: {siret:string,cp:string,created:string}[] = [];
    while (true) {
      const { data } = await sb.from("pros").select("siret, postal_code, created_at, naf_code")
        .eq("category_id", id).eq("naf_code", naf).range(offset, offset + 999);
      const rows = data || [];
      if (rows.length === 0) break;
      for (const r of rows) {
        const cp = (r.postal_code || "").slice(0,2);
        if (DENSES.includes(cp)) dansDenses.push({siret:r.siret, cp, created:(r.created_at||"").slice(0,10)});
      }
      offset += rows.length;
    }
    console.log(`${slug} : ${dansDenses.length} fiches naf ${naf} situees dans les 19 dpts du run du 05/09`);
    console.log("   echantillon :", dansDenses.slice(0,5));
    // ces sirets sont-ils encore dans la categorie absorbee aujourd'hui ?
    const ech = dansDenses.slice(0,20).map(x=>x.siret);
    if (ech.length) {
      const { data: v } = await sb.from("pros").select("siret, category_id").in("siret", ech);
      const autres = (v||[]).filter(x => x.category_id !== id);
      console.log(`   sur ${ech.length} verifies : ${autres.length} ont change de categorie`);
    }
  }
}
main();
