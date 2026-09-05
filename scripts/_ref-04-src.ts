import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth:{persistSession:false, autoRefreshToken:false} });
(async () => {
  const { data } = await sb.from("seo_pages").select("slug,content").eq("type","metier_ville").not("content","is",null).limit(600);
  const rows = (data||[]) as any[];
  const url = rows.filter(r=>/https?:\/\//i.test(r.content)).length;
  const src = rows.filter(r=>/\bsource\s*:/i.test(r.content)).length;
  console.log(`pages contenant une URL (vraie citation) : ${url} / ${rows.length}`);
  console.log(`pages contenant "source :"               : ${src} / ${rows.length}`);
})();
