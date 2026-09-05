import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const FILTRE = "etat_admin.is.null,etat_admin.neq.F";
(async () => {
  const sb = getServiceClient();
  const couples: [string,string][] = [["Bordeaux","plombier"],["Lyon","plombier"],["Lyon","climaticien"],["Montpellier","plombier"],["Toulouse","plombier"],["Nantes","plombier"],["Marseille","plombier"],["Poitiers","plombier"]];
  console.log("ville/metier            | actifs | neq F (audit) | OR null-neqF (code prod) | ecart");
  for (const [ville, metier] of couples) {
    const { data: c } = await sb.from("cities").select("id,name,slug").ilike("name", ville).limit(20);
    const { data: cat } = await sb.from("categories").select("id,slug").eq("slug", metier).limit(1);
    if (!c?.length || !cat?.length) { console.log(`${ville}/${metier}: introuvable`); continue; }
    const ids = c.map(x => x.id);
    const base = () => sb.from("pros").select("id", { count: "exact", head: true })
      .in("city_id", ids).eq("category_id", cat![0].id).eq("is_active", true).is("deleted_at", null);
    const { count: tot } = await base();
    const { count: audit } = await base().neq("etat_admin", "F");
    const { count: prod } = await base().or(FILTRE);
    console.log(`${(ville+"/"+metier).padEnd(23)} | ${String(tot).padStart(6)} | ${String(audit).padStart(13)} | ${String(prod).padStart(24)} | +${(prod||0)-(audit||0)}`);
  }
  // Part globale de etat_admin NULL sur les fiches actives
  const g = () => sb.from("pros").select("id", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null);
  const { count: nul } = await g().is("etat_admin", null);
  const { count: a } = await g().eq("etat_admin", "A");
  const { count: f } = await g().eq("etat_admin", "F");
  console.log(`\nGLOBAL actifs : etat_admin NULL=${nul} A=${a} F=${f}`);
})().catch(e => { console.error(e.message); process.exit(1); });
