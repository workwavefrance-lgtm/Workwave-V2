/** REFUTATION 2 : que CONTIENT le contenu des 516 pages ? Sprint 3 (Claude,
 *  fourchettes de prix demandees a l'invite) -> prix INVENTES ? */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  const { data } = await sb.from("seo_pages")
    .select("slug,content,generated_at,type").eq("type","metier_ville").not("content","is",null).limit(600);
  const rows = (data||[]) as any[];
  const dates = rows.map(r=>String(r.generated_at||"").slice(0,10)).filter(Boolean).sort();
  console.log(`pages metier_ville avec contenu : ${rows.length}`);
  console.log(`generees entre ${dates[0]} et ${dates[dates.length-1]}`);
  const avecPrix = rows.filter(r=>/\d+\s*(€|euros)/i.test(r.content)).length;
  const avecSource = rows.filter(r=>/source|selon|https?:\/\//i.test(r.content)).length;
  console.log(`pages qui affichent au moins un montant en euros : ${avecPrix} (${(avecPrix/rows.length*100).toFixed(1)} %)`);
  console.log(`pages qui citent une source : ${avecSource} (${(avecSource/rows.length*100).toFixed(1)} %)`);
  const lg = rows.map(r=>r.content.length).sort((a,b)=>a-b);
  console.log(`longueur mediane du contenu : ${lg[Math.floor(lg.length/2)]} caracteres`);
  const ex = rows.find(r=>/\d+\s*(€|euros)/i.test(r.content));
  const m = ex.content.match(/[^.]*\d+\s*(?:€|euros)[^.]*\./);
  console.log(`\nextrait (${ex.slug}) : ${m?m[0].trim().slice(0,220):""}`);
})();
