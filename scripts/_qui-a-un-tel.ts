import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const hav=(a:any,b:any)=>{const R=6371,r=Math.PI/180;const dLat=(b.latitude-a.latitude)*r,dLon=(b.longitude-a.longitude)*r;
  const x=Math.sin(dLat/2)**2+Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(x));};
(async () => {
  const limite = new Date(Date.now()-15*86400e3).toISOString();
  const { data: pj } = await sb.from("projects")
    .select("id, category_id, city_id, categories(name), cities(name, latitude, longitude)")
    .eq("vertical","btp").not("status","in","(closed,deleted)").gte("created_at", limite);
  let tel=0, mail=0, rien=0;
  const parProjet: any[] = [];
  for (const p of (pj||[]) as any[]) {
    const cv=p.cities; if(!cv?.latitude) continue;
    const { data:c } = await sb.from("pros")
      .select("id, name, slug, phone, email, cities!inner(name, latitude, longitude)")
      .eq("category_id",p.category_id).eq("is_active",true).is("deleted_at",null).is("claimed_by_user_id",null)
      .neq("do_not_contact", true)
      .gte("cities.latitude",cv.latitude-0.5).lte("cities.latitude",cv.latitude+0.5)
      .gte("cities.longitude",cv.longitude-0.7).lte("cities.longitude",cv.longitude+0.7).limit(1000);
    const proches=(c||[]).filter((x:any)=>hav(cv,x.cities)<=40);
    const t=proches.filter((x:any)=>x.phone).length, m=proches.filter((x:any)=>x.email).length;
    tel+=t; mail+=m; rien+=proches.filter((x:any)=>!x.phone&&!x.email).length;
    if(t||m) parProjet.push({ id:p.id, metier:p.categories?.name, ville:cv.name, tel:t, mail:m, total:proches.length });
  }
  console.log(`autour des 34 chantiers recents :`);
  console.log(`   avec TELEPHONE : ${tel}`);
  console.log(`   avec EMAIL     : ${mail}`);
  console.log(`   sans rien      : ${rien}`);
  if (parProjet.length) {
    console.log(`\nprojets ou il y a QUELQU'UN a appeler :`);
    parProjet.sort((a,b)=>b.tel-a.tel).forEach(p=>
      console.log(`   #${String(p.id).padEnd(5)} ${String(p.metier).slice(0,20).padEnd(21)} ${String(p.ville).slice(0,18).padEnd(19)} ${String(p.tel).padStart(3)} tel, ${String(p.mail).padStart(3)} mail (sur ${p.total})`));
  } else console.log(`\nAUCUN pro joignable par telephone ni email sur les 34 chantiers.`);
})();
