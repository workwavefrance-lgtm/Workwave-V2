import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const SITE = "https://workwave.fr/";
const OUVERT = "etat_admin.is.null,etat_admin.neq.F";

async function pagesGsc() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  let all: any[] = [];
  for (let start = 0; start < 100000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: "2026-08-05", endDate: "2026-09-01", dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rows = r.data.rows || []; all.push(...rows); if (rows.length < 25000) break;
  }
  return all;
}

async function main() {
  // 1. catégories + villes (slug -> id)
  const cats = new Map<string, number>();
  { let off = 0; while (true) { const { data } = await sb.from("categories").select("id,slug").range(off, off + 999); const rows = data ?? []; if (!rows.length) break; for (const c of rows as any[]) cats.set(c.slug, c.id); off += rows.length; } }
  console.log("categories chargees :", cats.size);

  const villes = new Map<string, { id: number; pop: number }>();
  { let off = 0; while (true) { const { data } = await sb.from("cities").select("id,slug,population").range(off, off + 999); const rows = data ?? []; if (!rows.length) break;
      for (const c of rows as any[]) { const prev = villes.get(c.slug); if (!prev || (c.population ?? 0) > prev.pop) villes.set(c.slug, { id: c.id, pop: c.population ?? 0 }); }
      off += rows.length; } }
  console.log("slugs de communes charges :", villes.size);

  // 2. pages GSC listing metier/ville
  const all = await pagesGsc();
  type P = { url: string; metier: string; ville: string; imp: number; clics: number; pos: number };
  const listings: P[] = [];
  for (const r of all) {
    const p = (r.keys![0] as string).replace("https://workwave.fr", "");
    const seg = p.split("/").filter(Boolean);
    if (seg.length !== 2) continue;
    if (/-\d{2,3}$/.test(seg[1])) continue; // departement
    if (!cats.has(seg[0]) || !villes.has(seg[1])) continue;
    listings.push({ url: p, metier: seg[0], ville: seg[1], imp: r.impressions || 0, clics: r.clicks || 0, pos: r.position || 0 });
  }
  const impTot = listings.reduce((s, x) => s + x.imp, 0);
  const clicTot = listings.reduce((s, x) => s + x.clics, 0);
  console.log(`\npages /[metier]/[ville] resolues : ${listings.length} | impressions ${impTot} | clics ${clicTot} (28 j, 05/08-01/09)`);

  // 3. echantillon : top 500 par impressions + 400 tirees au hasard dans la queue
  listings.sort((a, b) => b.imp - a.imp);
  const TOP = 500;
  const tete = listings.slice(0, TOP);
  const queue = listings.slice(TOP);
  const impTete = tete.reduce((s, x) => s + x.imp, 0);
  const impQueue = impTot - impTete;
  const ech: P[] = [];
  const idx = new Set<number>();
  while (idx.size < Math.min(400, queue.length)) idx.add(Math.floor(Math.random() * queue.length));
  for (const i of idx) ech.push(queue[i]);
  console.log(`tete = ${tete.length} pages / ${impTete} impr (${(100*impTete/impTot).toFixed(1)}%) ; queue = ${queue.length} pages / ${impQueue} impr ; echantillon queue = ${ech.length} pages`);

  // 4. comptage des pros ouverts pour chaque couple
  async function compte(m: string, v: string) {
    const { count, error } = await sb.from("pros").select("id", { count: "exact", head: true })
      .eq("category_id", cats.get(m)!).eq("city_id", villes.get(v)!.id).eq("is_active", true).is("deleted_at", null).or(OUVERT);
    if (error) return -1;
    return count ?? 0;
  }
  async function mesurer(lot: P[], nom: string) {
    const res: { p: P; n: number }[] = [];
    const C = 8;
    for (let i = 0; i < lot.length; i += C) {
      const bloc = lot.slice(i, i + C);
      const ns = await Promise.all(bloc.map(x => compte(x.metier, x.ville)));
      bloc.forEach((p, k) => res.push({ p, n: ns[k] }));
    }
    const ok = res.filter(r => r.n >= 0);
    const iTot = ok.reduce((s, r) => s + r.p.imp, 0), cTot = ok.reduce((s, r) => s + r.p.clics, 0);
    const b = (f: (n: number) => boolean) => {
      const s = ok.filter(r => f(r.n));
      const i = s.reduce((a, r) => a + r.p.imp, 0), c = s.reduce((a, r) => a + r.p.clics, 0);
      return `${String(s.length).padStart(4)} pages (${(100*s.length/ok.length).toFixed(1).padStart(5)}%) | ${String(i).padStart(6)} impr (${(100*i/Math.max(iTot,1)).toFixed(1).padStart(5)}%) | ${String(c).padStart(4)} clics (${(100*c/Math.max(cTot,1)).toFixed(1).padStart(5)}%) | CTR ${(100*c/Math.max(i,1)).toFixed(2)}%`;
    };
    console.log(`\n--- ${nom} (${ok.length} pages mesurees, ${iTot} impr, ${cTot} clics) ---`);
    console.log("  0 pro   :", b(n => n === 0));
    console.log("  1 pro   :", b(n => n === 1));
    console.log("  2 pros  :", b(n => n === 2));
    console.log("  3-9 pros:", b(n => n >= 3 && n <= 9));
    console.log("  >=10    :", b(n => n >= 10));
    return { ok, iTot, cTot };
  }
  const rTete = await mesurer(tete, "TETE (500 pages les plus vues)");
  const rQueue = await mesurer(ech, "ECHANTILLON QUEUE (aleatoire)");

  // 5. extrapolation de la part d'impressions issues des pages a 1 pro
  const part1Queue = rQueue.iTot > 0 ? rQueue.ok.filter(r => r.n === 1).reduce((s, r) => s + r.p.imp, 0) / rQueue.iTot : 0;
  const imp1Tete = rTete.ok.filter(r => r.n === 1).reduce((s, r) => s + r.p.imp, 0);
  const estim = imp1Tete + part1Queue * impQueue;
  console.log(`\n=== EXTRAPOLATION ===`);
  console.log(`impressions des pages a 1 pro : ${imp1Tete} (tete, mesure) + ${Math.round(part1Queue*impQueue)} (queue, extrapole a ${(100*part1Queue).toFixed(1)}%) = ~${Math.round(estim)} sur ${impTot} = ${(100*estim/impTot).toFixed(1)}% des impressions listing`);
  console.log(`soit ~${(estim/28).toFixed(0)} impressions/jour sur ${(impTot/28).toFixed(0)} impressions/jour de listing`);
}
main().catch(e => console.error(e));
