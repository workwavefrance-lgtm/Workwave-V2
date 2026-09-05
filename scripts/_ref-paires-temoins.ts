import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { google } from "googleapis";
import * as fs from "fs";
const sb = getServiceClient();
(async () => {
  // 1. l'ensemble des URL fiches VUES par Google sur 28 jours
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const vues = new Set<string>();
  let startRow = 0;
  while (true) {
    const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: { startDate: "2026-08-05", endDate: "2026-09-01", dimensions: ["page"], rowLimit: 25000, startRow } });
    const got = r.data.rows || [];
    for (const x of got) if ((x.keys as string[])[0].includes("/artisan/")) vues.add((x.keys as string[])[0].replace("https://workwave.fr/artisan/", ""));
    if (got.length < 25000) break; startRow += got.length;
  }
  console.log(`fiches vues par Google (>=1 impression) : ${vues.size}`);

  // 2. groupes ville x metier a >=2 fiches ouvertes, pris au hasard sur la table
  const paires: any[] = [];
  const depart = [200000, 900000, 1500000, 2100000, 2800000, 3400000, 4000000];
  for (const d of depart) {
    const { data } = await sb.from("pros").select("id,slug,city_id,category_id,city:cities(name)")
      .eq("is_active", true).is("deleted_at", null).neq("etat_admin", "F").gt("id", d).limit(1000);
    const lot = (data || []) as any[];
    const g = new Map<string, any[]>();
    for (const p of lot) { const k = `${p.city_id}|${p.category_id}`; const a = g.get(k) || []; a.push(p); g.set(k, a); }
    for (const [, arr] of g) {
      if (arr.length < 2) continue;
      const [a, b] = arr;
      const aVue = vues.has(a.slug), bVue = vues.has(b.slug);
      paires.push({ a: a.slug, b: b.slug, ville: a.city?.name, aVue, bVue });
      if (paires.filter(p => !p.aVue && !p.bVue).length >= 8) break;
    }
  }
  const jamaisVues = paires.filter(p => !p.aVue && !p.bVue).slice(0, 10);
  fs.writeFileSync("/tmp/_paires-temoins.json", JSON.stringify(jamaisVues, null, 1));
  console.log(`paires dont AUCUNE des deux fiches n'a eu d'impression : ${jamaisVues.length}`);
  jamaisVues.forEach(p => console.log(`  ${p.ville} : ${p.a} vs ${p.b}`));
})();
