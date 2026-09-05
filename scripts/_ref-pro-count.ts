import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { data: cats } = await sb.from("categories").select("slug, vertical").in("vertical", ["btp","domicile","personne"]);
  const btp = (cats||[]).filter(c=>c.vertical==="btp").length;
  const svc = (cats||[]).filter(c=>c.vertical!=="btp").length;
  const { count: depts } = await sb.from("departments").select("id", { count: "exact", head: true });
  console.log(`categories BTP           : ${btp}`);
  console.log(`categories domicile+pers : ${svc}`);
  console.log(`departements             : ${depts}`);
  console.log(`=> /trouver-des-chantiers/[slug] = ${btp} metiers + ${depts} depts = ${btp+(depts||0)} pages + 1 hub`);
  console.log(`=> /trouver-des-clients/[slug]   = ${svc} pages + 1 hub`);
  console.log(`=> TOTAL section pro            = ${btp+(depts||0)+svc+2}`);
  console.log(`Volume propose par l audit      : 57 metiers x 107 depts = ${57*107}`);
  // projets recus, pour juger la donnee "nombre de projets deja recus"
  const { count: proj } = await sb.from("projects").select("id", { count: "exact", head: true });
  console.log(`\nprojets en base (toutes dates)  : ${proj}`);
})();
