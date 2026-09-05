import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

async function main() {
  const sb = getServiceClient();
  // Toutes les fiches actives qui ont logo OU photos
  const a = await sb.from("pros").select("id, slug, city_id, category_id, logo_url, photos, etat_admin, claimed_by_user_id")
    .eq("is_active", true).is("deleted_at", null).neq("photos", "[]").limit(1000);
  const b = await sb.from("pros").select("id, slug, city_id, category_id, logo_url, photos, etat_admin, claimed_by_user_id")
    .eq("is_active", true).is("deleted_at", null).not("logo_url", "is", null).limit(1000);
  const map = new Map<number, any>();
  for (const r of [...(a.data ?? []), ...(b.data ?? [])]) map.set(r.id as number, r);
  const all = [...map.values()];
  console.log("fiches actives avec logo OU photos :", all.length);

  // combien sont OUVERTES (donc listables) ?
  const ouvertes = all.filter((r) => r.etat_admin !== "F");
  console.log("  dont ouvertes (etat_admin != F) :", ouvertes.length);
  console.log("  dont reclamees :", all.filter((r) => r.claimed_by_user_id).length);

  // combien de fiches ont AU MOINS une photo de NOTRE compartiment (supabase) ?
  let supaFiches = 0, googleOnly = 0;
  for (const r of all) {
    const ph = ((r.photos as unknown as string[]) ?? []).map((p) => typeof p === "string" ? p : JSON.stringify(p));
    const hasSupa = ph.some((p) => p.includes("supabase.co"));
    const hasGoogle = ph.some((p) => p.includes("googleapis.com"));
    if (hasSupa) supaFiches++;
    else if (hasGoogle) googleOnly++;
  }
  console.log("  fiches avec >=1 photo de NOTRE compartiment :", supaFiches);
  console.log("  fiches dont TOUTES les photos viennent de Google Places :", googleOnly);

  // Combien de photos googleapis portent une cle API en clair ?
  let avecCle = 0, totalG = 0;
  for (const r of all) {
    const ph = ((r.photos as unknown as string[]) ?? []).map((p) => typeof p === "string" ? p : JSON.stringify(p));
    for (const p of ph) if (p.includes("googleapis.com")) { totalG++; if (/[?&]key=/.test(p)) avecCle++; }
  }
  console.log(`  photos Google Places : ${totalG}, dont ${avecCle} avec key= en clair dans l'URL`);

  // Combien de couples (categorie, ville) DISTINCTS seraient concernes ?
  const couples = new Set(ouvertes.map((r) => `${r.category_id}|${r.city_id}`));
  console.log("  couples (metier x ville) distincts touches :", couples.size);
  const villes = new Set(ouvertes.map((r) => r.city_id));
  console.log("  villes distinctes touchees :", villes.size);
}
main().catch((e) => { console.error(e); process.exit(1); });
