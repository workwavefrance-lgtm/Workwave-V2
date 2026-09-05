import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function main() {
  const { data: cats, error: e1 } = await sb
    .from("categories")
    .select("id, slug, name, naf_codes, vertical")
    .in("vertical", ["btp", "domicile", "personne"]);
  if (e1) { console.error("ERREUR cats", e1); process.exit(1); }
  const parNaf = new Map<string, string[]>();
  for (const c of cats!) {
    for (const n of ((c.naf_codes || []) as string[])) {
      if (!parNaf.has(n)) parNaf.set(n, []);
      parNaf.get(n)!.push(`${c.name}#${c.id}`);
    }
  }
  console.log("=== NAF partages par plusieurs categories ===");
  for (const [naf, liste] of [...parNaf.entries()].sort()) {
    if (liste.length > 1) console.log(`  ${naf} -> ${liste.join(" | ")}`);
  }

  console.log("\n=== toutes les categories BTP (id, slug, naf) ===");
  for (const c of cats!.sort((a: any, b: any) => a.id - b.id)) {
    console.log(`  id=${String(c.id).padStart(4)} ${String(c.slug).padEnd(24)} ${JSON.stringify(c.naf_codes)}`);
  }

  const { data: ech, error: e2 } = await sb.from("pros").select("*").limit(1);
  if (e2) { console.error("ERREUR ech", e2); process.exit(1); }
  console.log("\n=== colonnes de pros ===");
  console.log(Object.keys(ech![0]).join(", "));
}
main();
