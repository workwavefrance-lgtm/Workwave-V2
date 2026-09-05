import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async()=>{
  const { data } = await sb.from("projects").select("id, city:cities(name, postal_code)").eq("id",84).maybeSingle();
  const c:any = (data as any)?.city;
  const city = Array.isArray(c)?c[0]:c;
  console.log(`Projet #84 → ville: ${city?.name}, code postal: ${city?.postal_code || "(VIDE)"}`);
  console.log(`→ Ligne 'Lieu' du mail : ${city?.name}${city?.postal_code?` (${city.postal_code})`:""}`);
})().catch(e=>console.error(e.message));
