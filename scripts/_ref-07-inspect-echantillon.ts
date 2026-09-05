/** REFUTATION 7 : POURQUOI les fiches ne sont-elles pas indexees ? Si le motif
 *  dominant est "Decouverte, actuellement non indexee", Google ne les a JAMAIS
 *  lues : la prose ne peut pas etre la cause. Echantillon aleatoire. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  // 60 fiches OUVERTES tirees au hasard dans l'intervalle d'id.
  const { data: bornes } = await sb.from("pros").select("id").eq("is_active",true).order("id",{ascending:false}).limit(1);
  const maxId = (bornes||[])[0]?.id || 2500000;
  const slugs: string[] = [];
  while (slugs.length < 60) {
    const r = Math.floor(Math.random()*maxId);
    const { data } = await sb.from("pros").select("slug").eq("is_active",true).is("deleted_at",null)
      .neq("etat_admin","F").gt("id", r).order("id").limit(1);
    const s = (data||[])[0]?.slug; if (s && !slugs.includes(s)) slugs.push(s);
  }
  const etats = new Map<string,number>(); let crawlees = 0, jamais = 0;
  for (const s of slugs) {
    const u = `https://workwave.fr/artisan/${s}`;
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: "https://workwave.fr/" } });
      const r = data.inspectionResult?.indexStatusResult || {};
      const k = `${r.verdict} · ${r.coverageState}`;
      etats.set(k, (etats.get(k)||0)+1);
      if (r.lastCrawlTime) crawlees++; else jamais++;
    } catch (e) { etats.set("ERREUR "+(e as Error).message.slice(0,50), (etats.get("ERREUR")||0)+1); }
    await new Promise(r=>setTimeout(r,150));
  }
  console.log(`echantillon : ${slugs.length} fiches OUVERTES tirees au hasard\n`);
  for (const [k,v] of [...etats.entries()].sort((a,b)=>b[1]-a[1]))
    console.log(`  ${String(v).padStart(3)} (${((v/slugs.length)*100).toFixed(0).padStart(3)} %)  ${k}`);
  console.log(`\ndeja explorees par Google au moins une fois : ${crawlees} · JAMAIS explorees : ${jamais}`);
})();
