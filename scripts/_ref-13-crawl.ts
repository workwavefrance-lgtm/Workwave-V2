import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth:{persistSession:false,autoRefreshToken:false}});
(async () => {
  const f = "/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad/slugs_gbot.txt";
  const all = fs.readFileSync(f, "utf8").split("\n").map(s => s.trim()).filter(Boolean).map(s => decodeURIComponent(s));
  const uniq = [...new Set(all)];
  const etat = new Map<string, string>();
  for (let i = 0; i < uniq.length; i += 200) {
    const { data, error } = await sb.from("pros").select("slug,etat_admin").in("slug", uniq.slice(i, i + 200));
    if (error) { console.log("ERR", error.message); break; }
    for (const p of (data || []) as any[]) etat.set(p.slug, p.etat_admin);
  }
  let F = 0, A = 0, X = 0;
  for (const s of all) { const e = etat.get(s); if (e === "F") F++; else if (e === "A") A++; else X++; }
  console.log(`Googlebot sur /artisan/ le 2026-09-04 : ${all.length} passages (${uniq.length} URL distinctes)`);
  console.log(`  fermees  : ${F} (${(100*F/all.length).toFixed(1)} %)`);
  console.log(`  ouvertes : ${A} (${(100*A/all.length).toFixed(1)} %)`);
  console.log(`  introuvables en base : ${X}`);
})();
