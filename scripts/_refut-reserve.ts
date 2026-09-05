import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { google } from "googleapis";

(async () => {
  // 1. slugs deja exposes (>=1 impression sur 28j)
  const rows = JSON.parse(fs.readFileSync("/private/tmp/gsc/p_r28_full.json", "utf8"));
  const exposes = new Set<string>();
  for (const r of rows) {
    const p = r.keys[0].replace("https://workwave.fr", "").split("?")[0];
    if (p.startsWith("/artisan/")) exposes.add(p.replace("/artisan/", "").replace(/\/$/, ""));
  }
  console.log(`fiches exposees (28j) : ${exposes.size}`);

  // 2. echantillon aleatoire de fiches OUVERTES
  const sb = getServiceClient();
  const cible: { slug: string; name: string }[] = [];
  for (let essai = 0; essai < 40 && cible.length < 20; essai++) {
    const off = Math.floor(Math.random() * 1_200_000);
    const { data } = await sb.from("pros").select("slug,name")
      .eq("is_active", true).is("deleted_at", null).neq("etat_admin", "F")
      .range(off, off + 30);
    for (const p of data || []) if (!exposes.has(p.slug) && cible.length < 20) cible.push(p as never);
  }
  console.log(`echantillon de fiches OUVERTES et NON exposees : ${cible.length}\n`);

  // 3. verdict Google
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  const tally: Record<string, number> = {}; let crawles = 0;
  for (const f of cible) {
    const u = `https://workwave.fr/artisan/${f.slug}`;
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: "https://workwave.fr/" } });
      const r = data.inspectionResult?.indexStatusResult || {};
      const etat = r.coverageState || "?";
      tally[etat] = (tally[etat] || 0) + 1;
      if (r.lastCrawlTime) crawles++;
      console.log(`  ${(r.verdict || "?").padEnd(8)} | ${etat.padEnd(46)} | explo. ${r.lastCrawlTime ? r.lastCrawlTime.slice(0,10) : "JAMAIS"} | ${f.slug.slice(0,40)}`);
    } catch (e) { console.log(`  echec ${(e as Error).message.slice(0,70)}`); }
    await new Promise(r => setTimeout(r, 1200));
  }
  console.log(`\n=== VERDICT SUR L ECHANTILLON (${cible.length} fiches ouvertes non exposees) ===`);
  for (const [k, v] of Object.entries(tally).sort((a,b)=>b[1]-a[1]))
    console.log(`  ${String(v).padStart(3)} (${(100*v/cible.length).toFixed(0).padStart(3)}%) ${k}`);
  console.log(`  deja explorees par Google : ${crawles}/${cible.length} = ${(100*crawles/cible.length).toFixed(0)}%`);
})().catch(e => console.error(e.message));
