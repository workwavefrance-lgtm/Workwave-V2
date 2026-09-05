import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function pagine(build: (from: number, to: number) => any) {
  let off = 0; const PAGE = 1000; const out: any[] = [];
  while (true) {
    const { data, error } = await build(off, off + PAGE - 1);
    if (error) { console.log("  ERREUR pagination:", error.message || JSON.stringify(error)); return null; }
    const rows = data || [];
    if (rows.length === 0) break;
    out.push(...rows);
    off += rows.length;
    if (off > 200000) { console.log("  garde-fou 200k atteint"); break; }
  }
  return out;
}

(async () => {
  // Paris, categorie pisciniste (36), NAF 4329B, actives et ouvertes
  const rows = await pagine((a, b) => sb.from("pros")
    .select("id, name, naf_code, etat_admin, postal_code, claimed_by_user_id, category_id")
    .eq("category_id", 36).eq("naf_code", "4329B")
    .eq("is_active", true).is("deleted_at", null)
    .like("postal_code", "75%")
    .order("id").range(a, b));
  if (!rows) return;
  const ouverts = rows.filter(r => r.etat_admin !== "F");
  console.log("PARIS pisciniste NAF 4329B actives      :", rows.length);
  console.log("  dont etat_admin <> 'F' (ouverts)      :", ouverts.length);
  console.log("  dont etat_admin = 'F'                 :", rows.filter(r=>r.etat_admin==="F").length);
  console.log("  dont claimed_by_user_id non nul       :", rows.filter(r=>r.claimed_by_user_id).length);

  const re = /\b(ASCENSEUR|ASCENSORISTE|MONTE-CHARGE)/i;
  const reLarge = /ascens/i;
  const mOuverts = ouverts.filter(r => re.test(r.name));
  const mLargeOuverts = ouverts.filter(r => reLarge.test(r.name));
  console.log("\n  regex proposee /\\b(ASCENSEUR|ASCENSORISTE|MONTE-CHARGE)/i sur ouverts :", mOuverts.length);
  console.log("  regex large /ascens/i sur ouverts                                    :", mLargeOuverts.length);
  console.log("\n  echantillon (regex large, ouverts), 25 premiers :");
  mLargeOuverts.slice(0, 25).forEach(r => console.log("   -", r.name));
  console.log("\n  matches de la regex LARGE que la regex PROPOSEE rate :");
  mLargeOuverts.filter(r => !re.test(r.name)).forEach(r => console.log("   -", r.name));
})();
