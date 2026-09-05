import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async()=>{ const sb=getServiceClient();
 const { data, error } = await sb.from("categories").select("slug,name,vertical").in("vertical",["btp","domicile","personne"]);
 if (error) { console.log("ERR", error.message); return; }
 const g:Record<string,any[]>={}; for(const c of data||[]) (g[c.vertical] ||= []).push(c);
 for(const v of Object.keys(g)) console.log(`${v} : ${g[v].length} categories`);
 console.log("\nNOMS domicile+personne (cibles /trouver-des-clients) :");
 console.log([...(g.domicile||[]),...(g.personne||[])].map(c=>c.name).join(" | "));
 console.log("\nNOMS btp (cibles /trouver-des-chantiers) :");
 console.log((g.btp||[]).map(c=>c.name).join(" | "));
})();
