import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  for (const b of ["100","110","120","130","140","142"]) {
    const slugs = fs.readFileSync(`/tmp/sm_${b}.txt`, "utf8").split("\n").filter(Boolean);
    const ech: string[] = [];
    for (let i = 0; i < slugs.length && ech.length < 60; i += Math.floor(slugs.length/60)) ech.push(slugs[i]);
    const { data, error } = await sb.from("pros").select("id, created_at, etat_admin").in("slug", ech);
    if (error) { console.log(b, "ERREUR", error.message); continue; }
    const rows = data || [];
    const ids = rows.map(r => r.id as number).sort((a,b)=>a-b);
    const dates = rows.map(r => String(r.created_at).slice(0,10)).sort();
    const fermes = rows.filter(r => r.etat_admin === "F").length;
    console.log(`sitemap ${b} : n=${rows.length}  id ${ids[0]}..${ids[ids.length-1]}  cree du ${dates[0]} au ${dates[dates.length-1]}  fermes=${fermes} (${Math.round(100*fermes/rows.length)}%)`);
  }
})();
