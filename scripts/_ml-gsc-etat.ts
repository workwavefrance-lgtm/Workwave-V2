import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";

async function tirer(etat: string, n: number) {
  const sb = getServiceClient(); const out: any[] = [];
  for (let t = 0; t < 6 && out.length < n; t++) {
    const ids: number[] = []; for (let i = 0; i < 1200; i++) ids.push(Math.floor(Math.random() * 2_450_000) + 1);
    const { data } = await sb.from("pros").select("slug,etat_admin,categories(vertical)").in("id", ids)
      .eq("is_active", true).is("deleted_at", null).eq("etat_admin", etat).limit(150);
    for (const p of (data || []) as any[]) if (p.categories?.vertical !== "tech") out.push(p);
  }
  return out.slice(0, n);
}
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  for (const etat of ["A", "F"]) {
    const ech = await tirer(etat, 12);
    const compte: Record<string, number> = {}; let refOui = 0, jamais = 0;
    for (const p of ech) {
      try {
        const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: `https://workwave.fr/artisan/${p.slug}`, siteUrl: site } });
        const r: any = data.inspectionResult?.indexStatusResult || {};
        const k = `${r.verdict} / ${r.coverageState}`;
        compte[k] = (compte[k] || 0) + 1;
        if (r.referringUrls) refOui++;
        if (!r.lastCrawlTime) jamais++;
      } catch (e) { compte["erreur"] = (compte["erreur"] || 0) + 1; }
      await new Promise(r => setTimeout(r, 300));
    }
    console.log(`\n=== etat_admin='${etat}' (${ech.length} fiches inspectees dans Search Console) ===`);
    for (const [k, v] of Object.entries(compte).sort((a,b)=>b[1]-a[1])) console.log(`  ${v}  ${k}`);
    console.log(`  avec un lien referent connu de Google : ${refOui}/${ech.length}`);
    console.log(`  jamais explorees : ${jamais}/${ech.length}`);
  }
})();
