import * as dotenv from "dotenv"; import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

async function main() {
  const sb = getServiceClient();

  const { count: pg } = await sb.from("price_guides").select("*", { count: "exact", head: true });
  console.log("price_guides total:", pg);

  // combien de questions-reponses deja publiees dans les guides
  let offset = 0, guides: any[] = [];
  while (true) {
    const { data, error } = await sb.from("price_guides").select("slug, faq").range(offset, offset + 999);
    if (error) { console.log("err faq:", error.message); break; }
    const rows = data || []; if (!rows.length) break;
    guides.push(...rows); offset += rows.length;
  }
  let nbFaq = 0, guidesAvecFaq = 0;
  for (const g of guides) {
    const f = g.faq;
    const arr = Array.isArray(f) ? f : (f && Array.isArray(f.items) ? f.items : []);
    if (arr.length) { guidesAvecFaq++; nbFaq += arr.length; }
  }
  console.log(`guides avec FAQ: ${guidesAvecFaq} | questions-reponses deja publiees dans price_guides: ${nbFaq}`);

  const { count: prj } = await sb.from("projects").select("*", { count: "exact", head: true });
  const { count: prjOk } = await sb.from("projects").select("*", { count: "exact", head: true }).neq("status", "deleted");
  console.log("projects total:", prj, "| non supprimes:", prjOk);

  const { count: cats } = await sb.from("categories").select("*", { count: "exact", head: true });
  console.log("categories:", cats);
  const { count: villes } = await sb.from("cities").select("*", { count: "exact", head: true });
  console.log("cities:", villes);
}
main().catch(e => { console.error("ERR", e.message); process.exit(1); });
