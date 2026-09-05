import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import { getMatchCategoryIds } from "@/lib/email/broadcast-btp-project";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function poolCount(ids: number[]): Promise<number> {
  const orFilter = ids.flatMap(id => [`category_id.eq.${id}`, `secondary_category_ids.cs.{${id}}`]).join(",");
  const { count } = await sb.from("pros").select("id",{count:"exact",head:true})
    .or(orFilter).eq("is_active",true).is("deleted_at",null);
  return count || 0;
}

(async()=>{
  // IDs de référence
  const { data: cats } = await sb.from("categories").select("id, slug")
    .in("slug",["plombier","chauffagiste","climaticien","electricien"]);
  const id = (s:string)=> cats!.find(c=>c.slug===s)!.id;
  console.log("IDs:", cats);

  // 1) Un projet CLIM doit cibler le cluster des 3 métiers
  const climMatch = await getMatchCategoryIds(sb, id("climaticien"));
  console.log(`\nProjet CLIM (id ${id("climaticien")}) → matchCategoryIds = [${climMatch}]  ${JSON.stringify([...climMatch].sort()) === JSON.stringify([id("plombier"),id("chauffagiste"),id("climaticien")].sort()) ? "✅ les 3 métiers" : "❌"}`);

  // 2) Un projet CHAUFFAGISTE → idem cluster
  const chauffMatch = await getMatchCategoryIds(sb, id("chauffagiste"));
  console.log(`Projet CHAUFFAGISTE → [${chauffMatch}]  ${chauffMatch.length===3?"✅":"❌"}`);

  // 3) Un projet HORS cluster (électricien) → catégorie exacte seulement
  const elecMatch = await getMatchCategoryIds(sb, id("electricien"));
  console.log(`Projet ÉLECTRICIEN (hors cluster) → [${elecMatch}]  ${elecMatch.length===1 && elecMatch[0]===id("electricien")?"✅ exact, pas élargi":"❌"}`);

  // 4) PREUVE de l'élargissement du pool (avant Haversine/claimed)
  const avant = await poolCount([id("climaticien")]);
  const apres = await poolCount(climMatch);
  console.log(`\nPool éligible pour un lead CLIM (pros actifs) :`);
  console.log(`  AVANT (climaticien seul) : ${avant.toLocaleString("fr-FR")}`);
  console.log(`  APRÈS (cluster)          : ${apres.toLocaleString("fr-FR")}   → ×${(apres/avant).toFixed(1)}`);
})().catch(e=>{console.error(e.message);process.exit(1);});
