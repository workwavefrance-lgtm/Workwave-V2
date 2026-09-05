import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

(async () => {
  // 1. la categorie existe-t-elle ?
  const { data: cats, error: e1 } = await sb.from("categories")
    .select("id, slug, name, vertical, parent_id")
    .in("slug", ["ascensoriste", "pisciniste"]);
  if (e1) { console.log("ERR cats", e1.message); return; }
  console.log("CATEGORIES:", JSON.stringify(cats, null, 1));

  const asc = cats?.find((c: any) => c.slug === "ascensoriste");
  const pis = cats?.find((c: any) => c.slug === "pisciniste");
  if (!asc) { console.log("PAS DE CATEGORIE ascensoriste"); return; }

  // 2. count exact pros ascensoriste
  for (const [label, q] of [
    ["asc total (toutes lignes)", sb.from("pros").select("id", { count: "exact", head: true }).eq("category_id", asc.id)],
    ["asc actives", sb.from("pros").select("id", { count: "exact", head: true }).eq("category_id", asc.id).eq("is_active", true).is("deleted_at", null)],
  ] as any) {
    const { count, error } = await q;
    console.log(label, "=>", error ? "ERREUR: " + error.message : count);
  }

  if (pis) {
    const { count, error } = await sb.from("pros").select("id", { count: "exact", head: true })
      .eq("category_id", pis.id).eq("is_active", true).is("deleted_at", null);
    console.log("pisciniste actives =>", error ? "ERREUR: " + error.message : count);
  }
})();
