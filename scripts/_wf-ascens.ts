import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data: pisc } = await sb.from("categories").select("id").eq("slug", "pisciniste").single();
  const noms: string[] = [];
  let offset = 0;
  while (true) {
    const { data } = await sb.from("pros").select("name")
      .eq("category_id", pisc!.id).eq("is_active", true).is("deleted_at", null).range(offset, offset + 999);
    const r = data || []; if (!r.length) break;
    noms.push(...r.map((x: any) => x.name)); offset += r.length;
  }
  for (const marque of ["OTIS", "KONE", "SCHINDLER"]) {
    const tous = noms.filter((n) => new RegExp(`\\b${marque}\\b`, "i").test(n));
    const exacts = tous.filter((n) => new RegExp(`^${marque}\\b`, "i").test(n));
    const autres = tous.filter((n) => !new RegExp(`^${marque}\\b`, "i").test(n));
    console.log(`  ${marque} : ${tous.length} au total, ${exacts.length} commencent par la marque`);
    if (autres.length) console.log(`     NE COMMENCENT PAS par la marque (${autres.length}) : ${[...new Set(autres)].slice(0, 8).join(" · ")}`);
    console.log(`     formes exactes : ${[...new Set(exacts)].slice(0, 6).join(" · ")}`);
  }
})();
