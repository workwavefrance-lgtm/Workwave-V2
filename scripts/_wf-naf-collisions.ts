import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function main() {
  // Lecture complete de categories, paginee (plafond 1000).
  const cats: any[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await sb
      .from("categories")
      .select("id, slug, name, vertical, naf_codes")
      .range(offset, offset + 999);
    if (error) throw error;
    const rows = data || [];
    if (rows.length === 0) break;
    cats.push(...rows);
    offset += rows.length;
  }
  console.log(`categories lues : ${cats.length}`);
  const parVertical: Record<string, number> = {};
  for (const c of cats) parVertical[c.vertical ?? "null"] = (parVertical[c.vertical ?? "null"] || 0) + 1;
  console.log("par vertical :", parVertical);

  // Index NAF -> categories
  const idx = new Map<string, any[]>();
  for (const c of cats) {
    for (const n of (c.naf_codes || [])) {
      if (!idx.has(n)) idx.set(n, []);
      idx.get(n)!.push(c);
    }
  }

  console.log("\n=== TOUTES les collisions NAF (>=2 categories) ===");
  const collisions = [...idx.entries()].filter(([, v]) => v.length > 1).sort();
  for (const [naf, list] of collisions) {
    console.log(
      `${naf} : ` +
        list.map((c) => `${c.slug}(id=${c.id},v=${c.vertical})`).join("  |  ")
    );
  }
  console.log(`total collisions : ${collisions.length}`);

  console.log("\n=== NAF des categories domicile + personne ===");
  for (const c of cats.filter((c) => c.vertical === "domicile" || c.vertical === "personne").sort((a,b)=>a.id-b.id)) {
    console.log(`id=${c.id} ${c.vertical.padEnd(9)} ${c.slug.padEnd(28)} naf=${JSON.stringify(c.naf_codes)}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
