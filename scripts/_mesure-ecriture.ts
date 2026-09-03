import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function mesure(etat: "A" | "F", n: number) {
  const { data } = await sb.from("pros").select("siret, etat_admin, date_fermeture, entreprise_etat, entreprise_date_fermeture, etat_verifie_at").eq("etat_admin", etat).not("etat_verifie_at", "is", null).limit(n);
  const lot = (data || []).map((p) => ({ siret: p.siret, etat_admin: p.etat_admin, date_fermeture: p.date_fermeture, entreprise_etat: p.entreprise_etat, entreprise_date_fermeture: p.entreprise_date_fermeture }));
  const verifie = data?.[0]?.etat_verifie_at;
  let t = Date.now();
  const r1 = await sb.rpc("classer_etats_lot", { lot, verifie_at: verifie });
  const tRpc = Date.now() - t;
  t = Date.now();
  const r2 = await sb.from("pros").update({ etat_verifie_at: verifie }).in("siret", lot.map((l) => l.siret));
  const tDirect = Date.now() - t;
  console.log(`${etat} x ${lot.length} : RPC ${tRpc} ms ${r1.error ? "ERREUR " + r1.error.message : "ok " + r1.data} | UPDATE direct (meme valeur) ${tDirect} ms ${r2.error ? "ERREUR " + r2.error.message : "ok"}`);
}
(async () => { await mesure("A", 50); await mesure("F", 50); await mesure("A", 200); await mesure("F", 200); })();
