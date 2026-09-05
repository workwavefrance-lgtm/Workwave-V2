import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { FILTRE_OUVERTS } from "../lib/queries/pros";
const gsc: Record<string, [number, number]> = JSON.parse(fs.readFileSync("/tmp/gsc-artisan.json", "utf8"));
(async () => {
  const sb = getServiceClient();
  // grappes reelles : on part de fiches ouvertes au hasard, on garde celles dont
  // la grappe (metier x commune) compte entre 8 et 400 fiches ouvertes.
  const grappes: { cat: number; ville: number; n: number }[] = [];
  while (grappes.length < 25) {
    const ids: number[] = []; for (let i = 0; i < 400; i++) ids.push(Math.floor(Math.random() * 2_450_000) + 1);
    const { data } = await sb.from("pros").select("id,category_id,city_id")
      .in("id", ids).eq("is_active", true).is("deleted_at", null).or(FILTRE_OUVERTS).limit(80);
    for (const p of ((data as any[]) || [])) {
      if (!p.city_id || !p.category_id || grappes.length >= 25) continue;
      const { count } = await sb.from("pros").select("id", { count: "exact", head: true })
        .eq("category_id", p.category_id).eq("city_id", p.city_id)
        .eq("is_active", true).is("deleted_at", null).or(FILTRE_OUVERTS);
      const n = count || 0;
      if (n >= 8 && n <= 400 && !grappes.some(g => g.cat === p.category_id && g.ville === p.city_id))
        grappes.push({ cat: p.category_id, ville: p.city_id, n });
    }
  }
  let cibN = 0, cibImp = 0, resN = 0, resImp = 0, cibClics = 0, resClics = 0;
  for (const g of grappes) {
    const { data: membres } = await sb.from("pros").select("slug")
      .eq("category_id", g.cat).eq("city_id", g.ville)
      .eq("is_active", true).is("deleted_at", null).or(FILTRE_OUVERTS).limit(400);
    const slugs = ((membres as any[]) || []).map(m => m.slug);
    if (slugs.length < 8) continue;
    // cibles = ce que le bloc "pros similaires" sert reellement, lu sur la page en ligne
    const r = await fetch(`https://workwave.fr/artisan/${slugs[0]}`, { redirect: "manual" });
    if (r.status !== 200) continue;
    const h = await r.text();
    const cibles = new Set([...h.matchAll(/href="\/artisan\/([^"\/]+)"/g)].map(m => m[1]));
    for (const s of slugs) {
      const imp = gsc[s]?.[1] || 0, cl = gsc[s]?.[0] || 0;
      if (cibles.has(s)) { cibN++; if (imp > 0) cibImp++; cibClics += cl; }
      else { resN++; if (imp > 0) resImp++; resClics += cl; }
    }
  }
  console.log(`grappes testees : ${grappes.length} (8 a 400 fiches ouvertes)`);
  console.log(`CIBLES du bloc pros similaires : ${cibN} fiches, ${cibImp} avec impressions (${(100*cibImp/Math.max(1,cibN)).toFixed(1)} %), ${cibClics} clics`);
  console.log(`RESTE (aucun lien recu)        : ${resN} fiches, ${resImp} avec impressions (${(100*resImp/Math.max(1,resN)).toFixed(1)} %), ${resClics} clics`);
})();
