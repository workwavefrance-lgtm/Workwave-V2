import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  // TOUTES les fiches au nom GILLANT, sans limite, pour ne rien manquer
  // (lecon du 06/08 : un .limit(10) avait masque la vraie cible et j'avais
  // desactive un homonyme).
  const { data, error } = await sb.from("pros")
    .select("id, slug, name, is_active, deleted_at, do_not_contact, email, phone, website, siret, city_id, cities(name, postal_code)")
    .ilike("name", "%GILLANT%");
  if (error) { console.error("ERREUR:", error.message); process.exit(1); }
  console.log(`${(data||[]).length} fiche(s) au nom GILLANT :\n`);
  (data||[]).forEach((p:any) => {
    const v = p.cities ? `${p.cities.name} (${p.cities.postal_code})` : "?";
    console.log(`  #${p.id}  ${p.name}`);
    console.log(`     slug   : ${p.slug}`);
    console.log(`     ville  : ${v}   siret ${p.siret || "-"}`);
    console.log(`     actif  : ${p.is_active}   supprimee : ${p.deleted_at || "non"}`);
    console.log(`     contact: mail=${p.email ? "PRESENT" : "vide"} tel=${p.phone ? "PRESENT" : "vide"} site=${p.website ? "PRESENT" : "vide"}`);
    console.log(`     ne pas contacter : ${p.do_not_contact}\n`);
  });
})();
