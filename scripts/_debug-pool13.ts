import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async()=>{
  // a) direct .eq (référence connue = 5847)
  const a = await sb.from("pros").select("id",{count:"exact",head:true})
    .eq("category_id",13).eq("is_active",true).is("deleted_at",null);
  console.log("a) .eq(category_id,13)              count=", a.count, "err=", a.error?.message||"none");
  // b) .or avec primary + secondary pour 13 (ce que faisait poolCount)
  const b = await sb.from("pros").select("id",{count:"exact",head:true})
    .or("category_id.eq.13,secondary_category_ids.cs.{13}").eq("is_active",true).is("deleted_at",null);
  console.log("b) .or(eq13, secondary cs {13})    count=", b.count, "err=", b.error?.message||"none");
  // c) .or primary seul (sans secondary)
  const c = await sb.from("pros").select("id",{count:"exact",head:true})
    .or("category_id.eq.13").eq("is_active",true).is("deleted_at",null);
  console.log("c) .or(category_id.eq.13)           count=", c.count, "err=", c.error?.message||"none");
})().catch(e=>console.error(e.message));
