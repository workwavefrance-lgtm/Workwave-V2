import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const AI = [43,44,45,46,47,48];
async function main() {
  const sb = getServiceClient();
  // pagination correcte (plafond PostgREST = 1000)
  const ids: number[] = [];
  for (let offset = 0; ; ) {
    const { data } = await sb.from("cities").select("id").order("id").range(offset, offset + 999);
    const rows = data || []; if (!rows.length) break;
    ids.push(...rows.map((r: any) => r.id)); offset += rows.length;
  }
  console.log(`communes chargees : ${ids.length}`);
  const N = 500;
  const tirage: number[] = [];
  for (let i = 0; i < N; i++) tirage.push(ids[Math.floor(Math.random() * ids.length)]);
  let couples1 = 0, couples2 = 0, couples3 = 0, pros = 0;
  for (let i = 0; i < tirage.length; i += 10) {
    await Promise.all(tirage.slice(i, i + 10).map(async (v) => {
      const { data } = await sb.from("pros").select("category_id")
        .eq("city_id", v).eq("is_active", true).is("deleted_at", null).eq("etat_admin", "A")
        .not("category_id", "in", `(${AI.join(",")})`).limit(3000);
      const m = new Map<number, number>();
      for (const x of (data || []) as any[]) m.set(x.category_id, (m.get(x.category_id) || 0) + 1);
      pros += (data || []).length;
      for (const n of m.values()) { couples1++; if (n >= 2) couples2++; if (n >= 3) couples3++; }
    }));
  }
  const f = ids.length / N;
  console.log(`\n${N} communes tirees au hasard sur ${ids.length} : ${pros} pros ouverts non-tech`);
  console.log(`  couples >=1 pro : ${couples1}  => national ~ ${Math.round(couples1*f).toLocaleString("fr-FR")}`);
  console.log(`  couples >=2 pros : ${couples2}  => national ~ ${Math.round(couples2*f).toLocaleString("fr-FR")}`);
  console.log(`  couples >=3 pros : ${couples3}  => national ~ ${Math.round(couples3*f).toLocaleString("fr-FR")}`);
  console.log(`\n  l audit annonce : ~753 000 pages en 200, et ~300 000 listings au seuil >=2`);
  console.log(`  le commit 7076a7b mesure (exhaustif) : 346 021 couples >=1, 83 406 couples >=3`);
}
main();
