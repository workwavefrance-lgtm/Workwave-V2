/** Les fiches ecrites par le rattrapage produisent-elles des pages valides ? */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  // Echantillon reparti : des fiches au slug rallonge (celles que le correctif
  // a sauvees) et des fiches ordinaires.
  const { data: rallongees } = await sb.from("pros")
    .select("slug, name, founding_date, forme_juridique, etat_admin, cities(name)")
    .gte("created_at", "2026-09-05T07:00:00Z").like("slug", "%-________________").limit(4);
  const { data: ordinaires } = await sb.from("pros")
    .select("slug, name, founding_date, forme_juridique, etat_admin, cities(name)")
    .gte("created_at", "2026-09-05T07:00:00Z").eq("etat_admin", "A").limit(6);
  const ech = [...(rallongees || []), ...(ordinaires || [])];
  console.log(`${ech.length} fiches testees en production\n`);
  for (const p of ech as any[]) {
    const u = `https://workwave.fr/artisan/${p.slug}`;
    const t = Date.now();
    let code = "?", titre = "";
    try {
      const r = await fetch(u, { signal: AbortSignal.timeout(90000) });
      code = String(r.status);
      const h = await r.text();
      titre = (h.match(/<title>(.*?)<\/title>/) || [, ""])[1];
    } catch (e) { code = "timeout"; }
    console.log(`  ${code} ${String(Date.now() - t).padStart(6)} ms  ${p.slug.slice(0, 44).padEnd(44)} ${titre.slice(0, 60)}`);
  }
})();
