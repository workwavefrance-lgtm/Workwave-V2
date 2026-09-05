import { config } from "dotenv"; import path from "path"; import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

const envScrape = fs.readFileSync(path.resolve(process.cwd(), "scraping/.env"), "utf8");
const KEY = (envScrape.match(/^INSEE_API_KEY=(.+)$/m) || [])[1]?.trim();
if (!KEY) { console.error("pas de cle INSEE"); process.exit(1); }

const BASE = "https://api.insee.fr/api-sirene/3.11/siret";
const OUVERTS = "etat_admin.is.null,etat_admin.neq.F";
const DEPTS = ["75", "13", "69", "59", "33"];

function fmtNaf(c: string) { return c.length === 5 && !c.includes(".") ? c.slice(0,2)+"."+c.slice(2) : c; }
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function sireneTotal(naf: string, dept: string, retry = 0): Promise<number | null> {
  const p = dept;
  const q = `periode(activitePrincipaleEtablissement:${fmtNaf(naf)} AND etatAdministratifEtablissement:A) AND codePostalEtablissement:[${p}000 TO ${p}999] AND -periode(etatAdministratifEtablissement:F)`;
  const url = `${BASE}?q=${encodeURIComponent(q)}&nombre=1&curseur=*`;
  const r = await fetch(url, { headers: { "X-INSEE-Api-Key-Integration": KEY, Accept: "application/json" } });
  if (r.status === 404) return 0;
  if ((r.status === 429 || r.status === 503) && retry < 4) { await sleep(30000); return sireneTotal(naf, dept, retry+1); }
  if (!r.ok) { console.error(`  HTTP ${r.status} pour ${naf}/${dept}`); return null; }
  const j: any = await r.json();
  return j?.header?.total ?? null;
}

async function cityIds(deptCode: string) {
  const { data: d, error } = await sb.from("departments").select("id, code, name").eq("code", deptCode).single();
  if (error) throw error;
  const ids: number[] = []; let off = 0;
  while (true) {
    const { data, error: e } = await sb.from("cities").select("id").eq("department_id", d.id).range(off, off + 999);
    if (e) throw e;
    if (!data || data.length === 0) break;
    ids.push(...data.map((r: any) => r.id)); off += data.length;
  }
  return { dept: d, ids };
}

(async () => {
  const { data: cats, error } = await sb.from("categories")
    .select("id, slug, name, naf_codes, vertical")
    .in("vertical", ["domicile", "personne"]).order("vertical").order("id");
  if (error) throw error;
  const withNaf = (cats || []).filter((c: any) => (c.naf_codes || []).length > 0);

  // NAF distincts -> categories qui le portent
  const nafToCats = new Map<string, string[]>();
  for (const c of withNaf) for (const n of c.naf_codes) {
    nafToCats.set(n, [...(nafToCats.get(n) || []), c.slug]);
  }

  const cityCache: Record<string, { dept: any; ids: number[] }> = {};
  for (const d of DEPTS) cityCache[d] = await cityIds(d);

  console.log("NAF\tCATEGORIES\tDEPT\tSIRENE_OUVERTS\tNOUS_OUVERTS_NAF\tCOUV_%");
  const lignes: any[] = [];
  for (const [naf, slugs] of [...nafToCats.entries()].sort()) {
    for (const d of DEPTS) {
      const tot = await sireneTotal(naf, d);
      await sleep(1600);
      const { ids } = cityCache[d];
      const { count, error: e } = await sb.from("pros").select("id", { count: "exact", head: true })
        .eq("naf_code", naf).in("city_id", ids).eq("is_active", true).is("deleted_at", null).or(OUVERTS);
      if (e) { console.error("  ERR count", naf, d, e.message); continue; }
      const couv = tot && tot > 0 ? ((count! / tot) * 100).toFixed(1) : "n/a";
      console.log(`${naf}\t${slugs.join("+")}\t${d}\t${tot ?? "NULL"}\t${count}\t${couv}`);
      lignes.push({ naf, slugs, d, tot, count });
    }
  }
  fs.writeFileSync("/tmp/wf-sirene-dp.json", JSON.stringify(lignes, null, 1));
  // totaux par NAF
  console.log("\n=== TOTAUX SUR LES 5 DEPTS ===");
  console.log("NAF\tCATEGORIES\tSIRENE\tNOUS\tCOUV_%");
  for (const [naf, slugs] of [...nafToCats.entries()].sort()) {
    const l = lignes.filter(x => x.naf === naf);
    if (l.some(x => x.tot === null)) { console.log(`${naf}\t${slugs.join("+")}\tINCOMPLET`); continue; }
    const s = l.reduce((a, x) => a + x.tot, 0), n = l.reduce((a, x) => a + x.count, 0);
    console.log(`${naf}\t${slugs.join("+")}\t${s}\t${n}\t${s ? ((n/s)*100).toFixed(1) : "n/a"}`);
  }
})();
