import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const base = () => sb.from("pros").select("id",{count:"exact",head:true}).eq("is_active",true).is("deleted_at",null);
(async () => {
  const q = async (label:string, f:(x:any)=>any) => {
    const { count, error } = await f(base());
    console.log(label.padEnd(46), error ? "ERR "+error.message.slice(0,60) : count);
  };
  await q("pros actifs (total)",             (x)=>x);
  await q("etat_admin = 'A' (ouverts stricts)",(x)=>x.eq("etat_admin","A"));
  await q("etat_admin = 'F' (fermes)",       (x)=>x.eq("etat_admin","F"));
  await q("etat_admin IS NULL (non classes)",(x)=>x.is("etat_admin",null));
  await q("date_fermeture renseignee",       (x)=>x.not("date_fermeture","is",null));
  await q("FILTRE_OUVERTS (A + null)",       (x)=>x.or("etat_admin.is.null,etat_admin.neq.F"));
  await q("entreprise_etat = 'C' (cessee)",  (x)=>x.eq("entreprise_etat","C"));
})().catch(e=>{console.error(e.message);process.exit(1);});
