import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function zone(catId: number, prefix: string, label: string) {
  console.log(`\n══ ${label} (cat ${catId}, CP ${prefix}xxx) ══`);
  // Pros avec un contact/social exploitable en priorité
  const { data, error } = await sb.from("pros")
    .select("id, name, slug, postal_code, email, phone, website, instagram, claimed_by_user_id, cities(name)")
    .eq("category_id", catId).eq("is_active", true).is("deleted_at", null)
    .like("postal_code", `${prefix}%`)
    .order("claimed_by_user_id", { ascending: false, nullsFirst: false })
    .limit(40);
  if (error) { console.log("ERREUR", error.message); return; }
  const withContact = (data||[]).filter(p => p.email || p.phone || p.website || p.instagram);
  console.log(`  ${data?.length} pros en base, dont ${withContact.length} avec contact/site/insta.`);
  for (const p of (data||[])) {
    const c = (p.cities as { name?: string } | null)?.name || "?";
    const bits = [
      p.instagram ? `IG:${p.instagram}` : null,
      p.website ? `web:${p.website}` : null,
      p.email ? `mail:${p.email}` : null,
      p.phone ? `tel:${p.phone}` : null,
    ].filter(Boolean).join(" ");
    console.log(`  #${p.id} ${(p.name||"").slice(0,32).padEnd(32)} ${c.padEnd(18)} ${bits || "(squelette, rien)"}${p.claimed_by_user_id ? " [RÉCLAMÉ]" : ""}`);
  }
}

async function main() {
  await zone(3, "16", "MAÇONS · Charente (lead Juignac, Jocelyne)");
  await zone(7, "56", "PLAQUISTES · Morbihan (lead Riantec, Jean-Pierre)");
}
main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
