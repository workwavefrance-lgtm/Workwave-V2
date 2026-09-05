import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async()=>{
  for(const slug of ["chauffagiste","climaticien","plombier"]){
    const { data: cat } = await sb.from("categories").select("id").eq("slug",slug).single();
    const { count: prim } = await sb.from("pros").select("id",{count:"exact",head:true})
      .eq("category_id",cat!.id).eq("is_active",true).is("deleted_at",null);
    // pros qui ont cette cat en SECONDAIRE
    const { count: sec } = await sb.from("pros").select("id",{count:"exact",head:true})
      .contains("secondary_category_ids",[cat!.id]).eq("is_active",true).is("deleted_at",null);
    console.log(`${slug.padEnd(13)} id=${cat!.id}  primaire=${prim}  secondaire=${sec}`);
  }
})().catch(e=>console.error(e.message));
