import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { count: cd, error: e1 } = await sb.from("commune_data").select("insee_code", { count: "exact", head: true });
  console.log("commune_data:", e1 ? "ERR "+e1.message.slice(0,90) : cd);
  const { data: sample } = await sb.from("commune_data").select("*").limit(1);
  console.log("commune_data colonnes:", sample?.[0] ? Object.keys(sample[0]).join(", ") : "(vide)");
  const { data: p } = await sb.from("pros").select("*").limit(1);
  const cols = p?.[0] ? Object.keys(p[0]) : [];
  console.log("pros colonnes RGE/etat:", cols.filter(k => /rge|etat|ferm|effectif|juridique|founded|date_creation|photo|note|rating|avis/i.test(k)).join(", "));
  // remplissage de quelques colonnes utiles
  const chk = async (col: string, op: "notnull"|"true" = "notnull") => {
    let q = sb.from("pros").select("id", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null);
    q = op === "true" ? q.eq(col, true) : q.not(col, "is", null);
    const { count, error } = await q; return error ? "ERR" : count;
  };
  for (const col of ["rge_number","phone","email","website","description","logo_url","nature_juridique","tranche_effectif","date_fermeture"]) {
    if (!cols.includes(col)) { console.log(`  ${col}: (colonne absente)`); continue; }
    console.log(`  ${col} rempli: ${await chk(col)}`);
  }
})().catch(e => { console.error(e.message); process.exit(1); });
