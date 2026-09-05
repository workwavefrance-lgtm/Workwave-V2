import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const PERDANTS = [
  [39,"videosurveillance-installateur"],[13,"climaticien"],[38,"ramoneur"],[41,"cuisiniste"],
  [11,"serrurier"],[37,"vitrier"],[36,"pisciniste"],[40,"nettoyage-pro"],
  [198,"traitement-nuisibles"],[32,"cours-particuliers"],[199,"ascensoriste"],
] as [number,string][];
(async () => {
  console.log("Existence d'au moins 1 fiche active (limit 1, pas un comptage) :");
  for (const [id, slug] of PERDANTS) {
    const { data, error } = await sb.from("pros").select("id")
      .eq("category_id", id).eq("is_active", true).is("deleted_at", null).limit(1);
    console.log(`  ${slug.padEnd(32)} id=${String(id).padEnd(4)} ${error ? "ERREUR "+error.message : (data && data.length ? "a des fiches" : ">>> ZERO FICHE <<<")}`);
  }

  // Le correctif filtre .eq("naf_code","4329B"). Combien de lignes 'ascens' sous
  // pisciniste ont un naf_code NUL ou autre, donc seraient RATEES par ce filtre ?
  let off = 0; const out: any[] = [];
  while (true) {
    const { data, error } = await sb.from("pros")
      .select("id, name, naf_code, etat_admin")
      .eq("category_id", 36).eq("is_active", true).is("deleted_at", null)
      .ilike("name", "%ascens%").order("id").range(off, off + 999);
    if (error) { console.log("ERR", error.message); break; }
    const r = data || []; if (r.length === 0) break;
    out.push(...r); off += r.length;
  }
  const ouv = out.filter(r => r.etat_admin !== "F");
  console.log("\nSous pisciniste, nom ~ 'ascens', actives, TOUS naf confondus :", out.length, "| ouvertes :", ouv.length);
  const parNaf: Record<string, number> = {};
  ouv.forEach(r => { const k = r.naf_code === null ? "(null)" : r.naf_code; parNaf[k] = (parNaf[k]||0)+1; });
  console.log("  repartition naf_code des ouvertes :", JSON.stringify(parNaf));
})();
