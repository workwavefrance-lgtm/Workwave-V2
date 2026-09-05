import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

const AI = [43,44,45,46,47,48];

async function main() {
  const sb = getServiceClient();
  const SCRATCH = "/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad/slugs_google.txt";
  const lignes = fs.readFileSync(SCRATCH, "utf8").trim().split("\n");
  const slugs = lignes.map((l) => l.split("\t")[0]).filter(Boolean);
  const hits: Record<string, number> = {};
  for (const l of lignes) { const [s,c] = l.split("\t"); if (s) hits[s] = Number(c); }

  // 1) Etat des fiches crawlees par Google
  const PAGE = 200;
  let trouve = 0, fermees = 0, ouvertes = 0, tech = 0, inconnu = 0;
  let hitsFerm = 0, hitsOuv = 0;
  const majAt: Record<string, number> = {};
  for (let i = 0; i < slugs.length; i += PAGE) {
    const lot = slugs.slice(i, i + PAGE);
    const { data, error } = await sb
      .from("pros")
      .select("slug, etat_admin, category_id, is_active, deleted_at, updated_at, date_fermeture")
      .in("slug", lot);
    if (error) { console.error("ERR", error.message); process.exit(1); }
    const vus = new Set<string>();
    for (const r of data || []) {
      vus.add(r.slug);
      trouve++;
      const h = hits[r.slug] || 1;
      if (AI.includes(r.category_id as number)) tech++;
      if (r.etat_admin === "F") { fermees++; hitsFerm += h; }
      else { ouvertes++; hitsOuv += h; }
      const j = String(r.updated_at).slice(0, 10);
      majAt[j] = (majAt[j] || 0) + 1;
    }
    for (const s of lot) if (!vus.has(s)) inconnu++;
  }
  console.log("=== FICHES CRAWLEES PAR GOOGLE (31/08 au 04/09), slugs distincts ===");
  console.log("slugs crawles :", slugs.length, "| trouves en base :", trouve, "| absents :", inconnu);
  console.log("fermees :", fermees, "ouvertes :", ouvertes, "=> part fermees :", ((fermees / trouve) * 100).toFixed(1), "%");
  console.log("dont categorie tech :", tech);
  console.log("en REQUETES (avec repetitions) : fermees", hitsFerm, "ouvertes", hitsOuv, "=> part", ((hitsFerm/(hitsFerm+hitsOuv))*100).toFixed(1), "%");
  console.log("updated_at des fiches crawlees, par jour :", Object.entries(majAt).sort((a,b)=>b[1]-a[1]).slice(0,8));
}
main();
