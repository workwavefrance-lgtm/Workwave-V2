import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import * as fs from "fs";
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const slugs = fs.readFileSync(process.argv[2], "utf8").trim().split("\n").map((u) => u.replace("/artisan/", ""));
  const { data, error } = await sb.from("pros").select("slug, etat_admin, entreprise_etat, is_active, deleted_at").in("slug", slugs);
  if (error) { console.log("ERREUR", error.message); return; }
  const rows = data || [];
  const compte: Record<string, number> = {};
  for (const r of rows) {
    const k = `etat_admin=${r.etat_admin ?? "null"} entreprise=${r.entreprise_etat ?? "null"}`;
    compte[k] = (compte[k] || 0) + 1;
  }
  console.log(`Fiches retrouvees en base : ${rows.length} / ${slugs.length}`);
  for (const [k, v] of Object.entries(compte).sort((a, b) => b[1] - a[1])) console.log(`  ${v}  ${k}`);
  const fermes = rows.filter((r) => r.etat_admin === "F").length;
  console.log(`\nEtablissements FERMES dans le lot : ${fermes} / ${rows.length} (${((fermes / rows.length) * 100).toFixed(0)} %)`);
})();
