import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { FILTRE_OUVERTS } from "../lib/queries/pros";
const gsc: Record<string, [number, number]> = JSON.parse(fs.readFileSync("/tmp/gsc-artisan.json", "utf8"));
const COMBOS: [string, string][] = [
  ["plombier","paris"],["electricien","paris"],["macon","lyon"],["peintre","marseille"],
  ["menage","bordeaux"],["menuisier","toulouse"],["couvreur","lille"],["carreleur","nantes"],
  ["electricien","montpellier"],["plombier","nice"],["macon","rennes"],["peintre","strasbourg"],
  ["plombier","poitiers"],["electricien","limoges"],["macon","angouleme"],
];
(async () => {
  const sb = getServiceClient();
  let cibN=0,cibImp=0,cibCl=0,cibImpTot=0, resN=0,resImp=0,resCl=0,resImpTot=0;
  for (const [cs, vs] of COMBOS) {
    const { data: c } = await sb.from("categories").select("id").eq("slug", cs).limit(1);
    const { data: v } = await sb.from("cities").select("id").eq("slug", vs).limit(1);
    if (!c?.length || !v?.length) { console.log("combo introuvable", cs, vs); continue; }
    const { data: m, count } = await sb.from("pros").select("slug", { count: "exact" })
      .eq("category_id", (c as any)[0].id).eq("city_id", (v as any)[0].id)
      .eq("is_active", true).is("deleted_at", null).or(FILTRE_OUVERTS).limit(500);
    const slugs = ((m as any[]) || []).map(x => x.slug);
    if (slugs.length < 8) { console.log(`${cs}/${vs} : ${slugs.length} fiches ouvertes, ignore`); continue; }
    const r = await fetch(`https://workwave.fr/artisan/${slugs[0]}`, { redirect: "manual" });
    if (r.status !== 200) { console.log(`${cs}/${vs} : HTTP ${r.status}`); continue; }
    const h = await r.text();
    const cibles = new Set([...h.matchAll(/href="\/artisan\/([^"\/]+)"/g)].map(x => x[1]));
    let ci=0, ri=0;
    for (const s of slugs) {
      const cl = gsc[s]?.[0]||0, im = gsc[s]?.[1]||0;
      if (cibles.has(s)) { cibN++; cibCl+=cl; cibImpTot+=im; if (im>0){cibImp++;ci++;} }
      else { resN++; resCl+=cl; resImpTot+=im; if (im>0){resImp++;ri++;} }
    }
    console.log(`${cs}/${vs} : ${count} ouvertes | cibles avec impressions ${ci}/${cibles.size} | reste avec impressions ${ri}/${slugs.length-cibles.size}`);
  }
  console.log(`\n=== CUMUL ===`);
  console.log(`CIBLES du bloc similaires : ${cibN} fiches, ${cibImp} avec impressions (${(100*cibImp/Math.max(1,cibN)).toFixed(1)} %), ${cibImpTot} impressions, ${cibCl} clics`);
  console.log(`RESTE (0 lien recu)       : ${resN} fiches, ${resImp} avec impressions (${(100*resImp/Math.max(1,resN)).toFixed(1)} %), ${resImpTot} impressions, ${resCl} clics`);
})();
