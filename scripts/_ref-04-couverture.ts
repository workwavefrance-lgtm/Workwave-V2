/** commune_data est-elle vraiment exploitable sur les communes visees ? */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  const acc: [string,number][] = JSON.parse(fs.readFileSync("/tmp/ref-catville.json","utf8"));
  const villes12 = new Set<number>(), villes3 = new Set<number>();
  for (const [k,n] of acc) { const v = Number(k.split("|")[1]); if (n<=2) villes12.add(v); else villes3.add(v); }
  console.log(`communes portant au moins une page a 1-2 pros : ${villes12.size}`);

  // insee des communes concernees
  const insee = new Map<number,string>(); let off=0;
  while(true){const {data}=await sb.from("cities").select("id,insee_code,population").range(off,off+999);
    const r=(data||[]) as any[]; if(!r.length)break; for(const c of r) if(villes12.has(c.id)&&c.insee_code) insee.set(c.id,c.insee_code); off+=r.length;}
  console.log(`dont avec code INSEE : ${insee.size}`);

  // commune_data disponible ?
  const cd = new Map<string,any>(); off=0;
  while(true){const {data,error}=await sb.from("commune_data")
      .select("insee_code,prix_m2_moyen,revenu_median,taux_vacance,densite_hab_km2").range(off,off+999);
    if(error){console.log("erreur commune_data :",error.message);break;}
    const r=(data||[]) as any[]; if(!r.length)break; for(const c of r) cd.set(c.insee_code,c); off+=r.length;}
  console.log(`lignes commune_data en base : ${cd.size}`);

  let ok=0, prix=0, rev=0, vac=0, dens=0, complet=0;
  for (const code of insee.values()) {
    const d = cd.get(code); if(!d) continue; ok++;
    if(d.prix_m2_moyen!=null)prix++; if(d.revenu_median!=null)rev++;
    if(d.taux_vacance!=null)vac++; if(d.densite_hab_km2!=null)dens++;
    if(d.prix_m2_moyen!=null&&d.revenu_median!=null&&d.taux_vacance!=null)complet++;
  }
  const n = insee.size;
  const p=(x:number)=>`${x} (${((x/n)*100).toFixed(1)} %)`;
  console.log(`\ncouverture sur les ${n} communes visees :`);
  console.log(`  ligne commune_data     : ${p(ok)}`);
  console.log(`  prix au m2             : ${p(prix)}`);
  console.log(`  revenu median          : ${p(rev)}`);
  console.log(`  taux de vacance        : ${p(vac)}`);
  console.log(`  densite                : ${p(dens)}`);
  console.log(`  les 3 chiffres cles    : ${p(complet)}`);
})();
