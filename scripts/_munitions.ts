import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const hav = (a: any, b: any) => { const R=6371,r=Math.PI/180;
  const dLat=(b.latitude-a.latitude)*r, dLon=(b.longitude-a.longitude)*r;
  const x=Math.sin(dLat/2)**2+Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(x)); };
(async () => {
  const limite = new Date(Date.now() - 15*86400e3).toISOString();
  const { data: pj } = await sb.from("projects")
    .select("id, category_id, city_id, urgency, created_at, categories(name), cities(name, postal_code, latitude, longitude)")
    .eq("vertical","btp").not("status","in","(closed,deleted)").gte("created_at", limite).order("created_at",{ascending:false});
  const sortie: any[] = []; let totalPros = 0;
  console.log("projet  metier                ville                  pros du metier a <=40 km (fiches sans contact)");
  for (const p of (pj||[]) as any[]) {
    const cv = p.cities; if (!cv?.latitude) continue;
    const { data: c } = await sb.from("pros")
      .select("id, name, slug, cities!inner(name, latitude, longitude)")
      .eq("category_id", p.category_id).eq("is_active", true).is("deleted_at", null)
      .is("claimed_by_user_id", null)
      .gte("cities.latitude", cv.latitude-0.5).lte("cities.latitude", cv.latitude+0.5)
      .gte("cities.longitude", cv.longitude-0.7).lte("cities.longitude", cv.longitude+0.7)
      .limit(1000);
    const proches = (c||[]).filter((x:any)=>hav(cv,x.cities)<=40)
      .map((x:any)=>({ nom:x.name, ville:x.cities.name, km:Math.round(hav(cv,x.cities)), fiche:`https://workwave.fr/artisan/${x.slug}` }))
      .sort((a:any,b:any)=>a.km-b.km);
    totalPros += proches.length;
    console.log(`#${String(p.id).padEnd(5)} ${String(p.categories?.name).slice(0,20).padEnd(21)} ${String(cv.name).slice(0,20).padEnd(21)} ${String(proches.length).padStart(4)}`);
    sortie.push({ projet:p.id, metier:p.categories?.name, ville:cv.name, cp:cv.postal_code,
      jours: Math.floor((Date.now()-new Date(p.created_at).getTime())/86400e3), pros: proches.slice(0,25) });
  }
  console.log(`\nPROS IDENTIFIABLES (nom + ville) autour des 34 projets : ${totalPros}`);
  console.log(`-> aucun n'a d'email en base : a retrouver un par un (Google / Instagram / annuaire)`);
  fs.writeFileSync("/Users/willygauvrit/Desktop/munitions-7jours.json", JSON.stringify(sortie,null,2));
  // CSV plat pour travailler
  const l = ["projet;jours;metier;ville_chantier;pro;ville_pro;km;fiche"];
  sortie.forEach(s=>s.pros.forEach((p:any)=>l.push(`${s.projet};${s.jours};${s.metier};${s.ville};${p.nom};${p.ville};${p.km};${p.fiche}`)));
  fs.writeFileSync("/Users/willygauvrit/Desktop/munitions-7jours.csv", l.join("\n"));
  console.log(`\necrit : ~/Desktop/munitions-7jours.csv (${l.length-1} lignes)`);
})();
