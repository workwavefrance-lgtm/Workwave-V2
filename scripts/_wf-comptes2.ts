import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
async function compte(label: string, qs: string, essais = 8): Promise<number | null> {
  for (let i = 1; i <= essais; i++) {
    const t0 = Date.now();
    try {
      const r = await fetch(`${URL}/rest/v1/pros?${qs}&select=id&limit=1`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: "count=exact", Range: "0-0" },
        signal: AbortSignal.timeout(150_000),
      });
      if (r.ok) {
        const n = Number((r.headers.get("content-range") || "/NaN").split("/")[1]);
        if (Number.isFinite(n)) { console.log(`${label} = ${n}  (essai ${i}, ${((Date.now()-t0)/1000).toFixed(1)}s)`); return n; }
      } else { await r.text(); }
    } catch { /* retry */ }
    console.log(`  ${label} : essai ${i} echoue (${((Date.now()-t0)/1000).toFixed(1)}s)`);
    await new Promise((r) => setTimeout(r, 5000));
  }
  console.log(`${label} = ECHEC apres ${essais} essais`);
  return null;
}
const A = "is_active=eq.true&deleted_at=is.null";
const AI = "(43,44,45,46,47,48,79,80,81,82,83,85,86,87)";
(async () => {
  await compte("actifs", A);
  await compte("actifs ouverts", `${A}&etat_admin=neq.F`);
  await compte("actifs fermes", `${A}&etat_admin=eq.F`);
  await compte("actifs etat_admin NULL", `${A}&etat_admin=is.null`);
  await compte("actifs NON tech", `${A}&category_id=not.in.${AI}`);
  await compte("actifs tech", `${A}&category_id=in.${AI}`);
  await compte("actifs NON tech OUVERTS", `${A}&etat_admin=neq.F&category_id=not.in.${AI}`);
})();
