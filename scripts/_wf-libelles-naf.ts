import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const NAFS=["8121Z","8129A","8122Z","9601A","9601B","4339Z","3832Z","3811Z","4942Z","5320Z","9522Z",
            "8891A","8559A","8559B","8810A","8899B","8899A","9609Z"];
(async()=>{
  for(const naf of NAFS){
    const {data}=await sb.from("pros").select("siret,name").eq("naf_code",naf).not("siret","is",null).limit(1);
    const siret=data?.[0]?.siret;
    if(!siret){console.log(`${naf}\t(aucun siret en base)`);continue;}
    const r=await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${siret}&per_page=1`);
    if(!r.ok){console.log(`${naf}\tHTTP ${r.status}`);await sleep(1200);continue;}
    const j:any=await r.json();
    const e=j?.results?.[0];
    const et=(e?.matching_etablissements||[]).find((x:any)=>x.siret===siret)||e?.siege;
    console.log(`${naf}\t${et?.libelle_activite_principale || e?.libelle_activite_principale || "?"}\t(via SIRET ${siret})`);
    await sleep(1200);
  }
})();
