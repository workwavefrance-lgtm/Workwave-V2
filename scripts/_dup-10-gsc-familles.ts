/** MESURE 8 : etat d'indexation REEL par famille de page, via l'API
 *  d'inspection d'URL de Search Console (verdict + coverageState). */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const SITE = "https://workwave.fr/";

(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });

  const acc: [string, number][] = JSON.parse(fs.readFileSync("/tmp/catville.json", "utf8"));
  const { data: cats } = await sb.from("categories").select("id,slug").in("vertical", ["btp","domicile","personne"]);
  const catSlug = new Map((cats || []).map((c: any) => [c.id, c.slug]));

  // Communes : id -> slug
  const villeSlug = new Map<number, string>(); let off = 0;
  while (true) { const { data } = await sb.from("cities").select("id,slug").range(off, off + 999);
    const r = (data || []) as any[]; if (!r.length) break; for (const c of r) villeSlug.set(c.id, c.slug); off += r.length; }

  const pick = (filtre: (n: number) => boolean, k: number) => {
    const out: string[] = [];
    for (const [key, n] of acc) {
      if (out.length >= k) break;
      const [c, v] = key.split("|").map(Number);
      const cs = catSlug.get(c), vs = villeSlug.get(v);
      if (cs && vs && filtre(n)) out.push(`/${cs}/${vs}`);
    }
    return out;
  };
  // Echantillon reparti : on parcourt acc dans un ordre melange stable
  acc.sort((a, b) => (a[0] + "x").localeCompare(b[0] + "x"));

  const familles: Record<string, string[]> = {
    "listing ville, 1 pro ouvert": pick((n) => n === 1, 12),
    "listing ville, 2 pros": pick((n) => n === 2, 8),
    "listing ville, 10+ pros": pick((n) => n >= 10, 10),
  };

  // Fiches pros ouvertes et fermees
  const { data: ouv } = await sb.from("pros").select("slug").eq("is_active", true).is("deleted_at", null)
    .or("etat_admin.is.null,etat_admin.neq.F").gt("id", 1_500_000).limit(12);
  const { data: fer } = await sb.from("pros").select("slug").eq("is_active", true).is("deleted_at", null)
    .eq("etat_admin", "F").gt("id", 1_500_000).limit(10);
  familles["fiche pro OUVERTE"] = (ouv || []).map((p: any) => `/artisan/${p.slug}`);
  familles["fiche pro FERMEE"] = (fer || []).map((p: any) => `/artisan/${p.slug}`);
  familles["listing departement"] = ["/plombier/vienne-86","/electricien/gironde-33","/couvreur/loire-atlantique-44","/peintre/nord-59","/macon/bouches-du-rhone-13","/menuisier/rhone-69"];
  familles["listing ville AVEC contenu redactionnel (86)"] = ["/plombier/poitiers","/electricien/poitiers","/macon/chatellerault","/peintre/poitiers","/couvreur/chatellerault","/menuisier/poitiers"];

  for (const [fam, urls] of Object.entries(familles)) {
    const etats: Record<string, number> = {};
    let crawlNul = 0, crawle = 0;
    for (const u of urls) {
      try {
        const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: `https://workwave.fr${u}`, siteUrl: SITE } });
        const r: any = data.inspectionResult?.indexStatusResult || {};
        const k = `${r.verdict} / ${r.coverageState}`;
        etats[k] = (etats[k] || 0) + 1;
        if (r.lastCrawlTime) crawle++; else crawlNul++;
      } catch (e: any) { etats[`ERREUR ${String(e.message).slice(0, 40)}`] = (etats[`ERREUR`] || 0) + 1; }
      await new Promise((r) => setTimeout(r, 250));
    }
    console.log(`\n### ${fam}  (${urls.length} URL inspectees, ${crawle} deja explorees / ${crawlNul} jamais)`);
    Object.entries(etats).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`   ${String(n).padStart(3)}  ${k}`));
  }
})();
