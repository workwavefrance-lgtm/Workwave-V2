/**
 * Nos fiches OUVERTES par (metier, departement), meme methode que
 * scripts/_couverture-denses.ts : jointure cities!inner(department_id),
 * is_active, deleted_at null, filtre ouverts.
 */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import fs from "fs";
const sb = getServiceClient();

const METIERS = ["plombier", "electricien", "macon"];

(async () => {
  const { data: cats, error: ec } = await sb.from("categories").select("id, slug").in("slug", METIERS);
  if (ec) throw new Error(ec.message);
  const { data: depts, error: ed } = await sb.from("departments").select("id, code, name").order("code");
  if (ed) throw new Error(ed.message);
  const idCat = new Map((cats || []).map((c: any) => [c.slug, c.id]));
  const fr = (depts || []).filter((d: any) => /^(\d{2,3}|2A|2B)$/.test(d.code));
  console.log(`${fr.length} departements francais, ${idCat.size} categories`);

  const couples: any[] = [];
  for (const m of METIERS) for (const d of fr) couples.push({ m, d });

  const res: any[] = [];
  const erreurs: string[] = [];
  let i = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (i < couples.length) {
      const { m, d } = couples[i++];
      const { count, error } = await sb.from("pros")
        .select("id, cities!inner(department_id)", { count: "exact", head: true })
        .eq("category_id", idCat.get(m)).eq("cities.department_id", d.id)
        .eq("is_active", true).is("deleted_at", null)
        .or("etat_admin.is.null,etat_admin.neq.F");
      if (error) { erreurs.push(`${m}|${d.code} : ${error.message}`); continue; }
      if (count === null || count === undefined) { erreurs.push(`${m}|${d.code} : count null`); continue; }
      res.push({ metier: m, dept: d.code, nom: d.name, nous: count });
    }
  }));

  console.log(`${res.length} couples mesures, ${erreurs.length} erreurs`);
  for (const e of erreurs) console.log("  ERREUR " + e);
  fs.writeFileSync("/tmp/nous_depts.json", JSON.stringify(res, null, 1));
  console.log("ecrit /tmp/nous_depts.json");
})();
