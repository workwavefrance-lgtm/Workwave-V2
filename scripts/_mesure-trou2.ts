import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data: cats } = await sb.from("categories").select("id").eq("vertical", "tech");
  const ai = (cats || []).map((c) => c.id);
  const base = () => sb.from("pros").select("id, category_id").eq("is_active", true).is("deleted_at", null);
  let t = Date.now();
  const a = await base().gt("id", 394442).order("id").limit(1000);
  console.log(`SANS filtre categorie, 1000 lignes apres 394442 : ${Date.now() - t} ms ${a.error ? "ERREUR " + a.error.message : "ok, dernier id " + a.data![a.data!.length - 1].id}`);
  t = Date.now();
  const b = await base().not("category_id", "in", `(${ai.join(",")})`).gt("id", 394442).order("id").limit(1000);
  console.log(`AVEC filtre NOT IN tech, 1000 lignes apres 394442 : ${Date.now() - t} ms ${b.error ? "ERREUR " + b.error.message : "ok, dernier id " + b.data![b.data!.length - 1].id}`);
  t = Date.now();
  const c = await base().not("category_id", "in", `(${ai.join(",")})`).gt("id", 394442).order("id").limit(50);
  console.log(`AVEC filtre, 50 lignes seulement : ${Date.now() - t} ms ${c.error ? "ERREUR " + c.error.message : "ok, dernier id " + c.data![c.data!.length - 1].id}`);
  // Ou commence la prochaine fiche non tech apres le bloc ? (via la RPC d'offset : skip 180000+32000)
  t = Date.now();
  const d = await sb.rpc("sitemap_batch_start_id", { skip_count: 212000, tech_mode: false });
  console.log(`RPC offset 212 000 : id ${d.data} en ${Date.now() - t} ms ${d.error ? "ERREUR " + d.error.message : ""}`);
})();
