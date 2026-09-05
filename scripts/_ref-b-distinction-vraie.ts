/** CONTRE-MESURE : pouvoir de distinction sur des groupes de voisins COMPLETS
 *  (toutes les fiches d une commune x metier), pas sur 250 ids consecutifs.
 *  Et sur TOUTES les colonnes gratuites, pas seulement les 6 du script d origine. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });

const COLS = ["effectif_range","address","founding_date","naf_code","forme_juridique","siret",
  "prenom_dirigeant","nom_dirigeant","nombre_etablissements","categorie_entreprise","enseignes",
  "nom_commercial","date_debut_activite","etab_latitude","postal_code","phone","website",
  "caractere_employeur","founded_year","google_rating","description"];

function val(v: any): string {
  if (v === null || v === undefined) return "(vide)";
  if (Array.isArray(v)) return v.length ? JSON.stringify(v) : "(vide)";
  if (typeof v === "object") return Object.keys(v).length ? JSON.stringify(v) : "(vide)";
  if (typeof v === "string") return v.trim() === "" ? "(vide)" : v;
  return String(v);
}

async function groupeComplet(ville: number, cat: number) {
  const out: any[] = []; let offset = 0; const PAGE = 1000;
  while (true) {
    const { data, error } = await sb.from("pros").select(COLS.join(",") + ",id")
      .eq("city_id", ville).eq("category_id", cat)
      .eq("is_active", true).is("deleted_at", null).or("etat_admin.is.null,etat_admin.neq.F")
      .order("id").range(offset, offset + PAGE - 1);
    if (error) { console.log("ERREUR", error.message); break; }
    const rows = (data || []) as any[];
    if (rows.length === 0) break;
    out.push(...rows); offset += rows.length;
    if (out.length >= 4000) break; // plafond de securite
  }
  return out;
}

(async () => {
  // groupes BTP et domicile reels, pas seulement du tech parisien
  const { data: gr } = await sb.rpc("pg_stat_statements_reset" as any).then(()=>({data:null})).catch(()=>({data:null}));
  const GROUPES: [number, number, string][] = [
    [12133, 14, "Paris x terrassier (btp)"],
    [6283, 29, "Le Mans x soutien-scolaire (personne)"],
    [24646, 85, "Metz x juridique-conseil (tech)"],
    [16720, 85, "Lyon x juridique-conseil (tech)"],
  ];
  for (const [ville, cat, label] of GROUPES) {
    const arr = await groupeComplet(ville, cat);
    console.log(`\n=== ${label} : ${arr.length} voisins COMPLETS ===`);
    const lignes = COLS.map((c) => {
      const vals = arr.map((r) => val(r[c]));
      const distinct = new Set(vals).size;
      const vides = vals.filter((v) => v === "(vide)").length;
      // frequence de la valeur la plus commune (hors vide)
      const f = new Map<string, number>();
      vals.forEach((v) => { if (v !== "(vide)") f.set(v, (f.get(v) || 0) + 1); });
      const top = [...f.entries()].sort((a, b) => b[1] - a[1])[0];
      return { col: c, distinct, pctRempli: (((arr.length - vides) / arr.length) * 100).toFixed(0) + "%",
        topVal: top ? (top[0].length > 22 ? top[0].slice(0, 22) + "..." : top[0]) : "-",
        pctTop: top ? ((top[1] / arr.length) * 100).toFixed(0) + "%" : "-" };
    }).sort((a, b) => b.distinct - a.distinct);
    console.table(lignes);
  }
})();
