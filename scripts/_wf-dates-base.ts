import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

const DEBUT = "2026-09-05T07:00:00Z"; // run 09h30 CEST -> 12h14 CEST

async function compte(nom: string, f: (q: any) => any) {
  const t0 = Date.now();
  try {
    const q = f(sb.from("pros").select("id", { count: "exact", head: true }));
    const { count, error } = await q.abortSignal(AbortSignal.timeout(180_000));
    if (error) { console.log(`${nom} : ERREUR ${error.message}`); return null; }
    if (count === null || count === undefined) { console.log(`${nom} : ERREUR count null`); return null; }
    console.log(`${nom} : ${count.toLocaleString("fr-FR")}   (${((Date.now()-t0)/1000).toFixed(1)} s)`);
    return count;
  } catch (e: any) { console.log(`${nom} : ERREUR ${e?.message || e}`); return null; }
}

(async () => {
  console.log("=== LIGNES CREEES PENDANT LE RUN (created_at >= " + DEBUT + ") ===");
  await compte("  lignes creees", (q) => q.gte("created_at", DEBUT));
  await compte("  dont founding_date renseignee", (q) => q.gte("created_at", DEBUT).not("founding_date", "is", null));
  await compte("  dont founding_date = 1900-01-01", (q) => q.gte("created_at", DEBUT).eq("founding_date", "1900-01-01"));
  await compte("  dont sirene_enrichi_at renseigne", (q) => q.gte("created_at", DEBUT).not("sirene_enrichi_at", "is", null));

  console.log("\n=== TOUTE LA BASE ===");
  await compte("  total lignes", (q) => q);
  await compte("  founding_date renseignee", (q) => q.not("founding_date", "is", null));
  await compte("  founding_date = 1900-01-01", (q) => q.eq("founding_date", "1900-01-01"));
  await compte("  founding_date < 1901-01-01", (q) => q.lt("founding_date", "1901-01-01"));
  await compte("  sirene_enrichi_at renseigne (convention unite legale)", (q) => q.not("sirene_enrichi_at", "is", null));
})();
