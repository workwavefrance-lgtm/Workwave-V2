import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

const sb = getServiceClient();
const slugs = fs.readFileSync("/tmp/slugs_gbot_0309.txt", "utf8").split("\n").map(s => s.trim()).filter(Boolean);

(async () => {
  console.log("slugs /artisan/ en 200 crawles par Googlebot le 03/09 :", slugs.length);
  const rows: any[] = [];
  for (let i = 0; i < slugs.length; i += 200) {
    const lot = slugs.slice(i, i + 200);
    const { data, error } = await sb
      .from("pros")
      .select("slug, etat_admin, entreprise_etat, date_fermeture, updated_at, claimed_by_user_id, category_id")
      .in("slug", lot);
    if (error) { console.error(error.message); process.exit(1); }
    rows.push(...(data || []));
  }
  console.log("retrouves en base :", rows.length, " (absents :", slugs.length - rows.length, ")");
  const f = rows.filter(r => r.etat_admin === "F").length;
  const dispa = rows.filter(r => r.entreprise_etat === "C").length;
  console.log("\nfermees (etat_admin=F) :", f, "=", ((f / rows.length) * 100).toFixed(1), "% des fiches crawlees");
  console.log("entreprises cessees (C):", dispa, "=", ((dispa / rows.length) * 100).toFixed(1), "%");
  console.log("reclamees               :", rows.filter(r => r.claimed_by_user_id).length);
  // distribution des updated_at (signal lastmod envoye a Google)
  const parJour: Record<string, number> = {};
  rows.forEach(r => { const j = (r.updated_at || "").slice(0, 10); parJour[j] = (parJour[j] || 0) + 1; });
  console.log("\nupdated_at (= lastmod annonce au sitemap) des fiches crawlees :");
  Object.entries(parJour).sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([j, n]) => console.log("   ", j, n));
})();
