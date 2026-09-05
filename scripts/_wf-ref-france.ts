import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

(async () => {
  // Filtre serveur : cat 36 + naf 4329B + nom contenant "ascens". Pagination stricte.
  let off = 0; const PAGE = 1000; const rows: any[] = [];
  const t0 = Date.now();
  while (true) {
    const { data, error } = await sb.from("pros")
      .select("id, name, etat_admin, postal_code, claimed_by_user_id, city_id")
      .eq("category_id", 36).eq("naf_code", "4329B")
      .eq("is_active", true).is("deleted_at", null)
      .ilike("name", "%ascens%")
      .order("id").range(off, off + PAGE - 1);
    if (error) { console.log("ERREUR:", error.message || JSON.stringify(error)); return; }
    const r = data || [];
    if (r.length === 0) break;
    rows.push(...r);
    off += r.length;
  }
  console.log(`lu en ${((Date.now()-t0)/1000).toFixed(1)}s`);
  const ouverts = rows.filter(r => r.etat_admin !== "F");
  console.log("FRANCE ENTIERE - pisciniste(36) + NAF 4329B + nom ~ 'ascens', actives :", rows.length);
  console.log("  dont ouverts (etat_admin <> 'F') :", ouverts.length);
  console.log("  dont claimed_by_user_id non nul  :", rows.filter(r=>r.claimed_by_user_id).length);
  const re = /\b(ASCENSEUR|ASCENSORISTE|MONTE-CHARGE)/i;
  console.log("  captes par la regex PROPOSEE (ouverts) :", ouverts.filter(r=>re.test(r.name)).length);
  console.log("  RATES par la regex proposee (ouverts)  :", ouverts.filter(r=>!re.test(r.name)).length);
  ouverts.filter(r=>!re.test(r.name)).slice(0,15).forEach(r=>console.log("     -", r.name));
  // departements distincts couverts apres reclassement
  const depts = new Set(ouverts.map(r => String(r.postal_code||"").slice(0,2)).filter(Boolean));
  console.log("\n  departements (prefixe CP) qui auraient >=1 ascensoriste ouvert :", depts.size);
  const parDept: Record<string, number> = {};
  ouverts.forEach(r => { const d = String(r.postal_code||"").slice(0,2); parDept[d] = (parDept[d]||0)+1; });
  const tries = Object.entries(parDept).sort((a,b)=>b[1]-a[1]);
  console.log("  top 15 :", tries.slice(0,15).map(([d,n])=>`${d}:${n}`).join(" "));
  console.log("  depts avec >= 3 :", tries.filter(([,n])=>n>=3).length, "| avec 1 ou 2 :", tries.filter(([,n])=>n<3).length);
})();
