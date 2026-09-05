import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

const FICHIER = process.argv[2];

async function main() {
  const sb = getServiceClient();
  const slugs = fs.readFileSync(FICHIER, "utf8").split("\n").map((s) => s.trim()).filter(Boolean);
  console.log(`slugs a resoudre : ${slugs.length}`);

  let ouverts = 0, fermes = 0, nulls = 0, absents = 0;
  const trouves = new Set<string>();
  for (let i = 0; i < slugs.length; i += 200) {
    const lot = slugs.slice(i, i + 200);
    const { data, error } = await sb
      .from("pros")
      .select("slug, etat_admin, is_active, deleted_at, claimed_by_user_id")
      .in("slug", lot);
    if (error) { console.error("ERREUR", error.message); process.exit(1); }
    for (const r of (data || []) as any[]) {
      trouves.add(r.slug);
      if (r.etat_admin === "F") fermes++;
      else if (r.etat_admin === null) nulls++;
      else ouverts++;
    }
  }
  absents = slugs.length - trouves.size;
  const total = ouverts + fermes + nulls;
  console.log(`FERMES (etat_admin='F') : ${fermes}  (${((fermes / total) * 100).toFixed(1)} %)`);
  console.log(`OUVERTS (etat_admin='A') : ${ouverts}  (${((ouverts / total) * 100).toFixed(1)} %)`);
  console.log(`NON CLASSES (etat_admin NULL) : ${nulls}  (${((nulls / total) * 100).toFixed(1)} %)`);
  console.log(`slugs absents de la base : ${absents}`);
}
main();
