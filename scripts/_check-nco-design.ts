import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Recherche large : nom commercial OU gérant. NCO DESIGN / Nelson Celestino.
  const patterns = ["%NCO%DESIGN%", "%NCO DESIGN%", "%NELSON%CELESTINO%", "%CELESTINO%"];
  const seen = new Set<number>();
  for (const p of patterns) {
    const { data, error } = await sb
      .from("pros")
      .select("id, slug, name, siret, postal_code, claimed_by_user_id, is_active, deleted_at, category_id, source, cities(name, departments(code, name))")
      .ilike("name", p)
      .limit(20);
    if (error) { console.error(p, error.message); continue; }
    for (const r of data || []) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      const c = r.cities as { name?: string; departments?: { code?: string } } | null;
      console.log(
        `#${r.id} | ${r.name} | SIRET ${r.siret || "-"} | CP ${r.postal_code || "-"} | ${c?.name || "?"} (${c?.departments?.code || "?"}) | claimed=${r.claimed_by_user_id ? "OUI" : "non"} | active=${r.is_active} | src=${r.source}`
      );
    }
  }
  if (seen.size === 0) console.log("AUCUNE fiche trouvée pour NCO DESIGN / Nelson Celestino dans la base.");
  else console.log(`\nTotal : ${seen.size} fiche(s).`);
}
main();
