import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const TEST = [4393, 99999, 1432477];
(async () => {
  const { data } = await sb.from("pros")
    .select("id, name, email, claimed_at, do_not_contact, email_bounced, categories(name), cities(name)")
    .not("claimed_by_user_id", "is", null).eq("is_active", true).is("deleted_at", null);
  const tous = (data || []) as any[];
  const vrais = tous.filter(p => !TEST.includes(p.id));
  const envoyables = vrais.filter(p => p.email && !p.do_not_contact && !p.email_bounced);
  console.log(`  pros avec compte      : ${tous.length}  (dont ${tous.length - vrais.length} comptes de test)`);
  console.log(`  destinataires reels   : ${envoyables.length}`);
  const ely = tous.find(p => String(p.email).includes("elytravaux"));
  console.log(`  ELY TRAVAUX           : ${ely ? `#${ely.id} ${ely.name} (${ely.categories?.name}, ${ely.cities?.name})` : "pas de compte"}`);
  // combien ont deja utilise des gratuits
  const { data: u } = await sb.from("lead_unlocks").select("pro_id, amount_cents");
  const parPro = new Map<number, number>();
  (u || []).forEach((x: any) => parPro.set(x.pro_id, (parPro.get(x.pro_id) || 0) + 1));
  const jamais = envoyables.filter(p => !parPro.has(p.id)).length;
  console.log(`  n'ont JAMAIS debloque : ${jamais}  -> ce sont eux qui ignorent l'offre`);
})();
