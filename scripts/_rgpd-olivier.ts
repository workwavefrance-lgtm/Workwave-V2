import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const EMAIL = "oliviersurlenet@neuf.fr";

async function main() {
  // 1. Blacklist (suppression list CNIL-compliant : on garde l'email pour NE PAS le recontacter)
  let bl = await sb.from("email_blacklist").insert({ email: EMAIL, reason: "Demande RGPD effacement (2026-06-20)" });
  if (bl.error && /column|reason/i.test(bl.error.message)) {
    bl = await sb.from("email_blacklist").insert({ email: EMAIL });
  }
  console.log(bl.error ? `⚠️ blacklist: ${bl.error.message}` : `✓ ${EMAIL} ajouté à email_blacklist`);

  // 2. Effacement des données perso sur le projet #76 (anonymisation RGPD), reste status=deleted
  const { error, data } = await sb.from("projects").update({
    first_name: "Anonymisé",
    email: "rgpd-efface@workwave.invalid",
    phone: null,
    description: "[Supprimé à la demande de l'utilisateur, RGPD]",
    ai_qualification: null,
    deletion_token: null,
  }).eq("id", 76).select("id");
  if (error) { console.error(`❌ effacement: ${error.message}`); process.exit(1); }
  console.log(`✓ Données perso effacées sur projet #${data?.[0]?.id}`);

  // 3. Vérification en base
  const { data: chk } = await sb.from("projects").select("id, status, first_name, email, phone, description").eq("id", 76).single();
  console.log(`\nVérification #76 :`);
  console.log(`  status=${chk?.status} | nom=${chk?.first_name} | email=${chk?.email} | tel=${chk?.phone ?? "null"}`);
  console.log(`  desc=${chk?.description}`);
  const { data: blc } = await sb.from("email_blacklist").select("email").eq("email", EMAIL);
  console.log(`  blacklist contient l'email : ${blc?.length ? "OUI ✓" : "non"}`);
}
main().catch(e=>{console.error(e.message);process.exit(1);});
