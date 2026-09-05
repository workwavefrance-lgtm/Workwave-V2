import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const FILTRE_OUVERTS = "etat_admin.is.null,etat_admin.neq.F";
(async () => {
  const { data: depts } = await sb.from("departments").select("id, code, name").order("code");
  const liste = (depts || []) as any[];
  // rafale volontaire de 40 pour provoquer l'echec et lire l'erreur brute
  const sous = liste.slice(0, 40);
  const res = await Promise.all(sous.map(async (d: any) => {
    const t = Date.now();
    const r = await sb.from("pros")
      .select("id, city:cities!inner(department_id)", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null).or(FILTRE_OUVERTS)
      .eq("cities.department_id", d.id);
    return { code: d.code, count: r.count, status: r.status, statusText: r.statusText, error: r.error, ms: Date.now() - t };
  }));
  const nuls = res.filter(r => r.count === null);
  console.log(`rafale 40 : ${nuls.length} nuls`);
  if (nuls[0]) console.log("erreur brute du 1er nul :", JSON.stringify(nuls[0], null, 2));
  const ok = res.find(r => r.count !== null);
  console.log("exemple OK :", JSON.stringify({ code: ok?.code, count: ok?.count, status: ok?.status, ms: ok?.ms }));
})();
