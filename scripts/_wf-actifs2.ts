import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
async function compte(label: string, qs: string) {
  const t0 = Date.now();
  try {
    const r = await fetch(`${URL}/rest/v1/pros?${qs}&select=id`, {
      method: "HEAD",
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: "count=exact" },
      signal: AbortSignal.timeout(180_000),
    });
    const cr = r.headers.get("content-range");
    console.log(label, "->", cr, `(${r.status}, ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  } catch (e: any) {
    console.log(label, "-> ECHEC", e.message, `(${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
}
(async () => {
  await compte("actifs", "is_active=eq.true&deleted_at=is.null");
  await compte("actifs ouverts (etat_admin neq F)", "is_active=eq.true&deleted_at=is.null&etat_admin=neq.F");
  await compte("actifs fermes", "is_active=eq.true&deleted_at=is.null&etat_admin=eq.F");
  await compte("actifs etat_admin null", "is_active=eq.true&deleted_at=is.null&etat_admin=is.null");
  await compte("total lignes", "id=gt.0");
})();
