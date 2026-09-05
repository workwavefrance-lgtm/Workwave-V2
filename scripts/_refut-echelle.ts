import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb=getServiceClient();
(async()=>{
  // combien de couples (categorie, ville) ont AU MOINS un pro, et combien ont 0 ouvert ?
  // via les RPC d agregat deja utilisees par le sitemap si elles existent
  const { data, error } = await sb.rpc("compter_pros_par_ville_categorie_ouverts" as any);
  if(error) console.log("RPC ouverts absente :", error.message.slice(0,90));
  else console.log("RPC ouverts -> lignes :", Array.isArray(data)?data.length:typeof data);
  const { data: d2, error: e2 } = await sb.rpc("compter_pros_par_ville_categorie" as any);
  if(e2) console.log("RPC totale absente :", e2.message.slice(0,90));
  else console.log("RPC totale -> lignes :", Array.isArray(d2)?d2.length:typeof d2);
})().catch(e=>{console.error(e.message)});
