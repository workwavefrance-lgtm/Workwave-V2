import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
async function compte(qs: string, essais = 10): Promise<number | null> {
  for (let i = 0; i < essais; i++) {
    try {
      const r = await fetch(`${URL}/rest/v1/pros?${qs}&select=id&limit=1`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: "count=exact", Range: "0-0" },
        signal: AbortSignal.timeout(150_000),
      });
      if (r.ok) { const n = Number((r.headers.get("content-range") || "/x").split("/")[1]); if (Number.isFinite(n)) return n; }
      else await r.text();
    } catch {}
    await new Promise((r) => setTimeout(r, 4000));
  }
  return null;
}
const A = "is_active=eq.true&deleted_at=is.null";
const AI = [43,44,45,46,47,48,79,80,81,82,83,85,86,87];
(async () => {
  // 1) actifs TECH, une categorie a la fois (petit volume, index category_id)
  let tech = 0; let techKo = 0;
  for (const c of AI) {
    const n = await compte(`${A}&category_id=eq.${c}`);
    if (n === null) { techKo++; console.log(`cat ${c} : ECHEC`); } else { tech += n; console.log(`cat ${c} : ${n}`); }
  }
  console.log(`ACTIFS TECH = ${tech} (categories en echec : ${techKo})`);

  // 2) actifs TOTAL par tranches d'id de 100 000
  const PAS = 100_000, MAX = 5_200_000;
  let total = 0, ko: string[] = [];
  for (let d = 0; d < MAX; d += PAS) {
    const n = await compte(`id=gte.${d}&id=lt.${d + PAS}&${A}`);
    if (n === null) ko.push(`${d}`); else total += n;
    if ((d / PAS) % 10 === 0) console.log(`  ...${d} cumul=${total} ko=${ko.length}`);
  }
  console.log(`ACTIFS TOTAL = ${total} (tranches en echec : ${ko.length} -> ${ko.join(",")})`);
  console.log(`ACTIFS NON TECH = ${total - tech}`);
  console.log(`tranches sitemap necessaires : non tech ${Math.ceil((total - tech) / 45000)}, tech ${Math.ceil(tech / 45000)}`);
})();
