import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function main() {
  // 1. Toutes les categories, sans order (comme le scraper)
  const { data, error } = await sb.from("categories").select("id, slug, name, naf_codes, vertical");
  if (error) { console.error("ERREUR", error); process.exit(1); }
  const cats = data || [];
  console.log("nb categories lues (sans order) :", cats.length);
  console.log("15 premieres dans l'ordre renvoye :");
  cats.slice(0, 15).forEach((c, i) => console.log(`  ${i}  id=${c.id}  ${c.slug}  vertical=${c.vertical}`));

  // L'ordre renvoye est-il celui des id ?
  const ids = cats.map(c => c.id);
  const trie = [...ids].sort((a, b) => a - b);
  console.log("ordre renvoye == ordre des id ?", JSON.stringify(ids) === JSON.stringify(trie));

  // 2. Collisions de NAF, sur le vertical btp uniquement (celui du run 05/09)
  const btp = cats.filter(c => c.vertical === "btp");
  console.log("\ncategories vertical btp :", btp.length);
  const parNaf = new Map<string, {id:number,slug:string}[]>();
  for (const c of btp) {
    for (const n of (c.naf_codes || [])) {
      if (!parNaf.has(n)) parNaf.set(n, []);
      parNaf.get(n)!.push({ id: c.id, slug: c.slug });
    }
  }
  const collisions = [...parNaf.entries()].filter(([, v]) => v.length > 1);
  console.log("NAF partages par >1 categorie btp :", collisions.length);
  for (const [naf, v] of collisions) {
    console.log(`  ${naf} : ${v.map(x => `${x.slug}(${x.id})`).join(" , ")}`);
  }
}
main();
