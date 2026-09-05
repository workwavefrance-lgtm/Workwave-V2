/**
 * Audit sécurité RLS : trouve les tables avec RLS DÉSACTIVÉE (alerte
 * "rls_disabled_in_public" du Security Advisor Supabase).
 * Une table RLS-OFF = anon peut LIRE des lignes ET ÉCRIRE (insert/update/delete).
 * Sonde INSERT {} NON destructive (échoue sur contrainte, ne crée rien).
 *   npx tsx scripts/_sec-audit-rls.ts
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const svc = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Tables de référence / publiques (lecture anon = normal). On teste si anon peut
// aussi ÉCRIRE → si oui, RLS est OFF = table exposée en écriture/suppression.
const TABLES = [
  // couvertes par la migration RLS du 22/05 (doivent être write-blocked) :
  "pros", "categories", "cities", "departments", "blog_posts", "seo_pages", "seo_guides",
  // ajoutées APRÈS le 22/05 (suspectes) :
  "commune_data", "price_guides", "pro_reviews", "provinces", "department_market",
  "site_stats", "sourced_prices", "intl_cities", "competitor_offers",
];

async function anonRead(t: string) {
  const r = await fetch(`${URL}/rest/v1/${t}?select=*&limit=1`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  });
  let body: any = []; try { body = await r.json(); } catch {}
  return { status: r.status, rows: Array.isArray(body) ? body.length : 0 };
}

async function anonInsertProbe(t: string) {
  const r = await fetch(`${URL}/rest/v1/${t}`, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: "{}",
  });
  let body: any = null; try { body = await r.json(); } catch {}
  const code = body?.code || "";
  if (r.status === 201) return { rlsOff: true, note: "🚨 INSÉRÉ (RLS OFF)" };
  if (code === "42501") return { rlsOff: false, note: "RLS ON (bloqué RLS/grant)" };
  if (code.startsWith("PGRST2")) return { rlsOff: null, note: "table absente" };
  if (/^23\d/.test(code)) return { rlsOff: true, note: `🚨 RLS OFF (passé RLS, bloqué par contrainte ${code})` };
  return { rlsOff: null, note: `? status ${r.status} code ${code || "-"}` };
}

async function main() {
  console.log("Table                 | count | anon lit | RLS écriture");
  console.log("-".repeat(78));
  const rlsOff: string[] = [];
  for (const t of TABLES) {
    const { count, error } = await svc.from(t).select("*", { count: "exact", head: true });
    if (error && /does not exist|Could not find/i.test(error.message)) {
      console.log(`${t.padEnd(21)} | (n'existe pas)`);
      continue;
    }
    const rd = await anonRead(t);
    const wr = await anonInsertProbe(t);
    if (wr.rlsOff === true) rlsOff.push(t);
    console.log(`${t.padEnd(21)} | ${String(count ?? 0).padStart(5)} | ${String(rd.rows).padStart(8)} | ${wr.note}`);
  }
  console.log("\n=== RÉSUMÉ ===");
  console.log(rlsOff.length
    ? `🚨 TABLE(S) RLS DÉSACTIVÉE (= l'alerte Supabase) : ${rlsOff.join(", ")}`
    : "✅ Toutes les tables testées ont la RLS active en écriture.");
}

main().catch((e) => { console.error("Erreur:", e); process.exit(1); });
