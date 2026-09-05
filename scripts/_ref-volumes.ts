import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const AI = [43,44,45,46,47,48];
(async () => {
  const sb = getServiceClient();
  const q = () => sb.from("pros").select("id",{count:"exact",head:true}).eq("is_active",true).is("deleted_at",null);
  const nonTech = (x:any) => x.not("category_id","in",`(${AI.join(",")})`);
  const { count: ntF } = await nonTech(q()).eq("etat_admin","F");
  const { count: ntA } = await nonTech(q()).eq("etat_admin","A");
  console.log(`fiches NON TECH (plage sitemap 100-147) : ouvertes=${ntA} fermees=${ntF} -> part fermee = ${(100*ntF!/(ntA!+ntF!)).toFixed(1)} %`);
  const { count: tF } = await q().in("category_id",AI).eq("etat_admin","F");
  const { count: tA } = await q().in("category_id",AI).eq("etat_admin","A");
  console.log(`fiches TECH (plage 200-213)             : ouvertes=${tA} fermees=${tF}`);
  console.log(`\n=> le chiffre "1 206 938 fermees declarees au sitemap /artisan/" melange les deux plages.`);
  console.log(`   fermees reellement dans la plage /artisan/ : ${ntF}`);
})();
