import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data } = await sb.from("pros").select("siret, etat_admin").eq("is_active", true).is("deleted_at", null).is("etat_verifie_at", null).not("siret", "is", null).limit(100);
  const sirets = (data || []).map((p) => p.siret);
  console.log(`${sirets.length} fiches non classees, etat_admin actuel : ${[...new Set((data || []).map((p) => p.etat_admin))].join(",")}`);
  for (const n of [10, 50, 100]) {
    const lot = sirets.slice(0, n);
    let t = Date.now();
    const r = await sb.from("pros").update({ etat_verifie_at: "2000-01-01T00:00:00Z" }).in("siret", lot);
    const t1 = Date.now() - t;
    t = Date.now();
    const r2 = await sb.from("pros").update({ etat_verifie_at: null }).in("siret", lot);
    console.log(`UPDATE direct ${n} lignes : ${t1} ms ${r.error ? "ERREUR " + r.error.message : "ok"} · retour a null ${Date.now() - t} ms ${r2.error ? "ERREUR " + r2.error.message : "ok"}`);
  }
})();
