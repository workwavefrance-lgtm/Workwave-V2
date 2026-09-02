import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
import { rechercherParSiret } from "@/lib/utils/recherche-entreprises";
const SITE = "https://workwave.fr/";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: "2026-07-25", endDate: "2026-08-14", dimensions: ["page"], rowLimit: 25000 } });
  const fiches = (r.data.rows || []).filter((x) => x.keys![0].includes("/artisan/")).map((x) => ({ slug: x.keys![0].split("/artisan/")[1].split("?")[0], clics: x.clicks || 0, imp: x.impressions || 0 }));
  console.log(`fiches artisan avec impressions du 25/07 au 14/08 : ${fiches.length} (sur ${r.data.rows?.length} pages), clics ${fiches.reduce((s, f) => s + f.clics, 0)}`);
  const ech = fiches.sort(() => Math.random() - 0.5).slice(0, 150);
  const sb = getServiceClient();
  const { data: pros } = await sb.from("pros").select("slug, siret").in("slug", ech.map((e) => e.slug));
  const siretBySlug = new Map((pros || []).map((p) => [p.slug, p.siret as string]));
  let ferme = 0, actif = 0, autre = 0, clicsFermes = 0, clicsActifs = 0, i = 0, demenage = 0, disparu = 0, clicsDemenage = 0;
  await Promise.all(Array.from({ length: 5 }, async () => {
    while (i < ech.length) {
      const e = ech[i++]; const s = siretBySlug.get(e.slug); if (!s) { autre++; continue; }
      const x = await rechercherParSiret(s);
      if (x.statut === "ok") { if (x.etablissement?.etat_administratif === "F") { ferme++; clicsFermes += e.clics; if ((x.unite as { etat_administratif?: string }).etat_administratif === "A") { demenage++; clicsDemenage += e.clics; } else disparu++; } else { actif++; clicsActifs += e.clics; } } else autre++;
      await new Promise((res) => setTimeout(res, 1000));
    }
  }));
  console.log(`echantillon ${ech.length} fiches VUES par Google : actives ${actif} (${clicsActifs} clics) · FERMEES ${ferme} (${clicsFermes} clics) · dont entreprise ACTIVE ailleurs ${demenage} (${clicsDemenage} clics), DISPARUE ${disparu} · autres ${autre}`);
})();
