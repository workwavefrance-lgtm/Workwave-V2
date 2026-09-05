import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  // Les dates anterieures a 1901 AUTRES que le bouchon 1900-01-01.
  for (const [nom, min, max] of [
    ["avant 1900-01-01", "1000-01-01", "1900-01-01"],
    ["dans 1900, hors 1er janvier", "1900-01-02", "1901-01-01"],
  ] as const) {
    let off = 0; const dates: Record<string, number> = {}; let n = 0;
    while (true) {
      const { data, error } = await sb.from("pros").select("id, name, slug, founding_date")
        .gte("founding_date", min).lt("founding_date", max).range(off, off + 999)
        .abortSignal(AbortSignal.timeout(150_000));
      if (error) { console.log(`${nom} : ERREUR ${error.message}`); break; }
      if (!data || data.length === 0) break;
      for (const r of data) { n++; const d = String(r.founding_date).slice(0,10); dates[d] = (dates[d]||0)+1; }
      off += data.length;
    }
    console.log(`${nom} : ${n} lignes`);
    const tri = Object.entries(dates).sort((a,b)=>b[1]-a[1]).slice(0,8);
    for (const [d,c] of tri) console.log(`    ${d} : ${c}`);
  }
})();
