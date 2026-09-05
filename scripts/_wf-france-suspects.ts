import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const CIBLES = [[199,"ascensoriste"],[37,"vitrier"],[11,"serrurier"],[13,"climaticien"],[36,"pisciniste"],[41,"cuisiniste"],[38,"ramoneur"],[39,"videosurveillance-installateur"]] as [number,string][];
async function main() {
  for (const [id, slug] of CIBLES) {
    const { count: act, error: e1 } = await sb.from("pros").select("id",{count:"exact",head:true})
      .eq("category_id", id).eq("is_active", true).is("deleted_at", null);
    if (e1) throw e1;
    const { count: ouv, error: e2 } = await sb.from("pros").select("id",{count:"exact",head:true})
      .eq("category_id", id).eq("is_active", true).is("deleted_at", null).or("etat_admin.is.null,etat_admin.neq.F");
    if (e2) throw e2;
    if (act === null || ouv === null) throw new Error(`count NULL pour ${slug}`);
    console.log(`${slug.padEnd(32)} actives=${String(act).padStart(7)}  ouvertes=${String(ouv).padStart(7)}   (France entiere)`);
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message||e);process.exit(1);});
