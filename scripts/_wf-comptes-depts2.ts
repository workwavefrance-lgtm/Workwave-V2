/**
 * Reprise : complete /tmp/nous_depts.json pour les couples manquants,
 * avec reessais (le count exact sur pros joint a cities depasse parfois
 * le delai). Un count null est une ERREUR, jamais un zero.
 */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import fs from "fs";
const sb = getServiceClient();
const METIERS = ["plombier", "electricien", "macon"];
const F = "/tmp/nous_depts.json";

(async () => {
  const deja: any[] = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, "utf8")) : [];
  const vus = new Set(deja.map((x) => `${x.metier}|${x.dept}`));
  const { data: cats } = await sb.from("categories").select("id, slug").in("slug", METIERS);
  const { data: depts } = await sb.from("departments").select("id, code, name").order("code");
  const idCat = new Map((cats || []).map((c: any) => [c.slug, c.id]));
  const fr = (depts || []).filter((d: any) => /^(\d{2,3}|2A|2B)$/.test(d.code));
  const couples: any[] = [];
  for (const m of METIERS) for (const d of fr) if (!vus.has(`${m}|${d.code}`)) couples.push({ m, d });
  console.log(`${deja.length} deja mesures, ${couples.length} a faire`);

  const echecs: string[] = [];
  let i = 0;
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (i < couples.length) {
      const { m, d } = couples[i++];
      let ok = false;
      for (let essai = 1; essai <= 6 && !ok; essai++) {
        const { count, error } = await sb.from("pros")
          .select("id, cities!inner(department_id)", { count: "exact", head: true })
          .eq("category_id", idCat.get(m)).eq("cities.department_id", d.id)
          .eq("is_active", true).is("deleted_at", null)
          .or("etat_admin.is.null,etat_admin.neq.F");
        if (!error && typeof count === "number") {
          deja.push({ metier: m, dept: d.code, nom: d.name, nous: count });
          fs.writeFileSync(F, JSON.stringify(deja, null, 1));
          console.log(`${m}|${d.code} -> ${count} (essai ${essai})`);
          ok = true;
        } else {
          await new Promise((r) => setTimeout(r, 3000 * essai));
        }
      }
      if (!ok) { echecs.push(`${m}|${d.code}`); console.log(`ECHEC ${m}|${d.code}`); }
    }
  }));
  console.log(`\ntotal ${deja.length} couples, ${echecs.length} echecs : ${echecs.join(", ")}`);
})();
