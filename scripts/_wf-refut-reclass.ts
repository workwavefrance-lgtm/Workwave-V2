import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function keyset(filtre: (q: any) => any) {
  const out: any[] = []; let last = 0;
  while (true) {
    let data: any[] | null = null;
    for (let e = 0; e < 4; e++) {
      const r = await filtre(sb.from("pros").select("id, name, slug, category_id, naf_code, claimed_by_user_id, etat_admin, is_active, deleted_at"))
        .gt("id", last).order("id", { ascending: true }).limit(500);
      if (!r.error) { data = r.data || []; break; }
      if (e === 3) throw new Error(r.error.message);
      await new Promise((res) => setTimeout(res, 3000));
    }
    if (data!.length === 0) break;
    out.push(...data!); last = data![data!.length - 1].id;
  }
  return out;
}

async function main() {
  // Candidats au reclassement : fiches classees pisciniste dont le nom parle d'ascenseur
  const rows = await keyset((q: any) => q.eq("category_id", 36).ilike("name", "%ASCENS%"));
  const claimed = rows.filter((r) => r.claimed_by_user_id);
  const visibles = rows.filter((r) => r.etat_admin !== "F" && r.is_active !== false && !r.deleted_at);
  console.log(`fiches cat 36 (pisciniste) dont le nom contient ASCENS : ${rows.length}`);
  console.log(`  dont visibles (ouvertes+actives) : ${visibles.length}`);
  console.log(`  dont reclamees par un pro (claimed_by_user_id non nul) : ${claimed.length}`);
  console.log("  exemples :", JSON.stringify(rows.slice(0, 6).map((r) => r.name)));
  const nafs = new Map<string, number>();
  for (const r of rows) nafs.set(r.naf_code || "null", (nafs.get(r.naf_code || "null") || 0) + 1);
  console.log("  naf_code des candidats :", JSON.stringify([...nafs.entries()]));
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
