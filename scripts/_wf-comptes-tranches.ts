import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function compte(qs: string): Promise<number | null> {
  for (let essai = 0; essai < 3; essai++) {
    try {
      const r = await fetch(`${URL}/rest/v1/pros?${qs}&select=id&limit=1`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: "count=exact", Range: "0-0" },
        signal: AbortSignal.timeout(120_000),
      });
      if (r.status >= 400) { await r.text(); continue; }
      const cr = r.headers.get("content-range");
      const n = cr ? Number(cr.split("/")[1]) : NaN;
      if (Number.isFinite(n)) return n;
    } catch { /* retry */ }
  }
  return null;
}

(async () => {
  // borne max d'id
  const rMax = await fetch(`${URL}/rest/v1/pros?select=id&order=id.desc&limit=1`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  const maxId = (await rMax.json())[0].id as number;
  console.log("id max =", maxId);

  const PAS = 200_000;
  let actifs = 0, ouverts = 0, fermes = 0, echecs = 0;
  for (let deb = 0; deb <= maxId; deb += PAS) {
    const fin = deb + PAS;
    const base = `id=gte.${deb}&id=lt.${fin}&is_active=eq.true&deleted_at=is.null`;
    const a = await compte(base);
    const o = await compte(base + "&etat_admin=neq.F");
    const f = await compte(base + "&etat_admin=eq.F");
    if (a === null || o === null || f === null) { echecs++; console.log(`[${deb}-${fin}] ECHEC a=${a} o=${o} f=${f}`); continue; }
    actifs += a; ouverts += o; fermes += f;
    console.log(`[${deb}-${fin}] actifs=${a} ouverts=${o} fermes=${f}`);
  }
  console.log("=== TOTAL actifs =", actifs, "| ouverts =", ouverts, "| fermes =", fermes, "| tranches en echec =", echecs);
})();
