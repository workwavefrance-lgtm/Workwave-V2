import { config } from "dotenv"; import path from "path"; import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const slugs = fs.readFileSync(process.argv[2], "utf8").split("\n").filter(Boolean);
  const c: Record<string, number> = { ouverte: 0, fermee: 0, absente: 0, enrichie: 0 };
  for (let i = 0; i < slugs.length; i += 500) {
    const lot = slugs.slice(i, i + 500);
    const { data } = await sb.from("pros").select("slug, etat_admin, sirene_enrichi_at, is_active, deleted_at").in("slug", lot);
    const m = new Map((data || []).map((p) => [p.slug, p]));
    for (const s of lot) { const p = m.get(s); if (!p || !p.is_active || p.deleted_at) c.absente++; else if (p.etat_admin === "F") c.fermee++; else { c.ouverte++; if (p.sirene_enrichi_at) c.enrichie++; } }
  }
  console.log(`fiches de l echantillon GSC (${slugs.length}) :`, c);
})();
