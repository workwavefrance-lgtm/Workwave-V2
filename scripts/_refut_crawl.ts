import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

const SCRATCH = "/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad/art_paths.txt";
const AI = [43,44,45,46,47,48,79,80,81,82,83,85,86,87];

(async () => {
  const slugs = fs.readFileSync(SCRATCH, "utf8").split("\n")
    .filter(Boolean).map((p) => decodeURIComponent(p.replace("/artisan/", "").trim()));
  console.log("slugs distincts crawles :", slugs.length);
  const sb = getServiceClient();
  const rows: any[] = [];
  for (let i = 0; i < slugs.length; i += 200) {
    const { data, error } = await sb.from("pros")
      .select("slug, etat_admin, is_active, deleted_at, category_id, claimed_by_user_id, updated_at")
      .in("slug", slugs.slice(i, i + 200));
    if (error) { console.log("ERR", error.message); return; }
    rows.push(...(data || []));
  }
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  let f = 0, a = 0, introuvable = 0, inactif = 0, tech = 0;
  for (const s of slugs) {
    const r = bySlug.get(s);
    if (!r) { introuvable++; continue; }
    if (!r.is_active || r.deleted_at) inactif++;
    if (AI.includes(r.category_id)) tech++;
    if (r.etat_admin === "F") f++; else a++;
  }
  console.log("trouves en base :", rows.length, "| introuvables :", introuvable);
  console.log("FERMES  :", f);
  console.log("OUVERTS :", a);
  console.log("part fermes :", ((f / (f + a)) * 100).toFixed(1) + " %");
  console.log("dont inactifs/supprimes :", inactif, "| dont categorie tech :", tech);
})();
