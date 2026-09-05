import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import * as fs from "fs";
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const slugs = fs.readFileSync(process.argv[2], "utf8").trim().split("\n").filter(Boolean);
  let ouverts = 0, fermes = 0, absents = 0;
  for (let i = 0; i < slugs.length; i += 200) {
    const lot = slugs.slice(i, i + 200);
    const { data, error } = await sb.from("pros").select("slug, etat_admin").in("slug", lot);
    if (error) { console.log("ERREUR", error.message); return; }
    const vus = new Set((data || []).map((r) => r.slug));
    absents += lot.filter((s) => !vus.has(s)).length;
    for (const r of data || []) { if (r.etat_admin === "F") fermes++; else ouverts++; }
  }
  const total = ouverts + fermes;
  console.log(`Fiches DISTINCTES crawlees par Google le 03/09 : ${slugs.length} (${absents} introuvables en base)`);
  console.log(`  ouvertes : ${ouverts} (${((ouverts / total) * 100).toFixed(1)} %)`);
  console.log(`  fermees  : ${fermes} (${((fermes / total) * 100).toFixed(1)} %)`);
  const p = fermes / total;
  console.log(`\nProbabilite que 45 fiches tirees au hasard soient TOUTES fermees : ${Math.pow(p, 45).toExponential(2)}`);
})();
