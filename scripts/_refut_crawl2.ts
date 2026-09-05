import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const S = "/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad";
(async () => {
  const sb = getServiceClient();
  for (const [f, lab] of [["d0209.txt", "02/09"], ["d0309.txt", "03/09"]] as const) {
    const slugs = fs.readFileSync(path.join(S, f), "utf8").split("\n").filter(Boolean)
      .map((p) => decodeURIComponent(p.replace("/artisan/", "").trim()));
    const map = new Map<string, string>();
    for (let i = 0; i < slugs.length; i += 200) {
      const { data } = await sb.from("pros").select("slug, etat_admin").in("slug", slugs.slice(i, i + 200));
      for (const d of data || []) map.set(d.slug, d.etat_admin);
    }
    let F = 0, A = 0, X = 0;
    for (const s of slugs) { const e = map.get(s); if (e === "F") F++; else if (e === "A") A++; else X++; }
    console.log(`${lab} : ${slugs.length} fiches | fermes ${F} | ouverts ${A} | absents ${X} | part fermes ${((F/(F+A))*100).toFixed(1)} %`);
  }
})();
