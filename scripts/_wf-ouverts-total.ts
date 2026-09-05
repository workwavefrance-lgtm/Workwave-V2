import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
async function compte(qs: string, essais = 10): Promise<number | null> {
  for (let i = 0; i < essais; i++) {
    try {
      const r = await fetch(`${URL}/rest/v1/pros?${qs}&select=id&limit=1`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: "count=exact", Range: "0-0" },
        signal: AbortSignal.timeout(150_000) });
      if (r.ok) { const n = Number((r.headers.get("content-range") || "/x").split("/")[1]); if (Number.isFinite(n)) return n; }
      else await r.text();
    } catch {}
    await new Promise((r) => setTimeout(r, 4000));
  }
  return null;
}
const A = "is_active=eq.true&deleted_at=is.null";
(async () => {
  const PAS = 100_000, MAX = 5_300_000;
  let ouv = 0, nul = 0, ko = 0;
  for (let d = 0; d < MAX; d += PAS) {
    const o = await compte(`id=gte.${d}&id=lt.${d + PAS}&${A}&etat_admin=neq.F`);
    const n = await compte(`id=gte.${d}&id=lt.${d + PAS}&${A}&etat_admin=is.null`);
    if (o === null || n === null) { ko++; } else { ouv += o; nul += n; }
    if ((d / PAS) % 10 === 0) console.log(`  ...${d} ouverts=${ouv} null=${nul} ko=${ko}`);
  }
  console.log(`OUVERTS (etat_admin <> 'F') = ${ouv} | etat_admin NULL = ${nul} | tranches en echec = ${ko}`);
  console.log(`=> compteur public "fiches ouvertes" = ${(ouv + nul).toLocaleString("fr-FR")}`);
})();
