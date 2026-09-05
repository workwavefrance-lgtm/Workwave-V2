import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function show(label:string, q:any){
  const { data, error } = await q;
  console.log(`\n══ ${label} (${data?.length||0})${error?" ERR "+error.message:""} ══`);
  for (const p of data||[]) {
    const c=p.cities as any;
    console.log(`  #${p.id} ${p.name} | ${(p.categories as any)?.name} | ${p.address||"-"} ${p.postal_code||""} ${c?.name||""} | tel:${p.phone||"-"} | slug:${p.slug}`);
  }
}
async function main(){
  const SEL="id, slug, name, address, postal_code, phone, email, slug, categories(name), cities(name)";
  await show("Par téléphone 0649794533", sb.from("pros").select(SEL).or("phone.ilike.%649794533%"));
  await show("Adresse contient ALLASSAC", sb.from("pros").select(SEL).ilike("address","%ALLASSAC%"));
  await show("Ville Allassac / CP 19240", sb.from("pros").select(SEL).like("postal_code","19240%").limit(15));
  await show("CM COUVERTURE en Corrèze (19)", sb.from("pros").select(SEL).ilike("name","%CM COUVERTURE%").like("postal_code","19%"));
}
main().catch(e=>{console.error(e.message);process.exit(1);});
