import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const BASE = "https://workwave.fr";
async function main() {
  const sb = getServiceClient();
  const lignes = fs.readFileSync("/tmp/noncouv.txt", "utf8").trim().split("\n");
  const ech = new Set<string>();
  for (let i = 0; i < 45; i++) ech.add(lignes[Math.floor(Math.random() * lignes.length)]);
  const slugs = [...new Set([...ech].map(l => l.split("/")[2]))];
  const { data } = await sb.from("cities").select("slug, departments(code,name)").in("slug", slugs);
  const dep = new Map((data || []).map((c: any) => {
    const n = (c.departments?.name || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return [c.slug, `${n}-${(c.departments?.code || "").toLowerCase()}`];
  }));
  let lieDept = 0, testes = 0, somme = 0;
  for (const l of ech) {
    const [, m, v] = l.split("/");
    const d = dep.get(v); if (!d) continue;
    const r = await fetch(`${BASE}/${m}/${d}`); if (!r.ok) continue;
    const h = await r.text(); testes++;
    const nb = [...new Set([...h.matchAll(new RegExp(`href="/${m}/([a-z0-9-]+)"`, "g"))].map(x => x[1]))].filter(x => !/-\d{2,3}$|-[a-z]{3}$/.test(x)).length;
    somme += nb;
    if (h.includes(`href="/${m}/${v}"`)) lieDept++;
  }
  console.log(`pages ville NON listees par la racine metier : ${lignes.length}`);
  console.log(`echantillon teste : ${testes}`);
  console.log(`  liees depuis leur page departement : ${lieDept} (${(100*lieDept/testes).toFixed(1)} %)`);
  console.log(`  liens ville moyens emis par une page departement : ${(somme/testes).toFixed(1)}`);
}
main();
