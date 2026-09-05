import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
async function compte(label: string, qs: string) {
  const t0 = Date.now();
  const r = await fetch(`${URL}/rest/v1/pros?${qs}&select=id&limit=1`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: "count=exact", Range: "0-0" },
    signal: AbortSignal.timeout(300_000),
  });
  const cr = r.headers.get("content-range");
  const body = r.status >= 400 ? await r.text() : "";
  console.log(label, "->", cr, `(${r.status}, ${((Date.now()-t0)/1000).toFixed(1)}s)`, body.slice(0, 300));
}
(async () => {
  await compte("actifs", "is_active=eq.true&deleted_at=is.null");
})();
