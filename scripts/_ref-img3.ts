import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main() {
  const { data } = await sb.from("pros").select("id,slug,name,photos,claimed_by_user_id")
    .is("deleted_at", null).eq("is_active", true).neq("photos","[]").not("photos","is",null).limit(300);
  const rows = data ?? [];
  const estDuPro = (u: string) => u.includes("supabase.co/storage");
  let fichesToutesDuPro: any[] = [], fichesMixtes = 0, fichesToutesTierces = 0;
  for (const r of rows) {
    const arr: any[] = Array.isArray(r.photos) ? r.photos : [];
    const urls = arr.map((p:any)=> typeof p === "string" ? p : (p?.url ?? p?.src ?? ""));
    const nb = urls.filter(estDuPro).length;
    if (nb === urls.length) fichesToutesDuPro.push({ slug: r.slug, n: urls.length, claimed: !!r.claimed_by_user_id });
    else if (nb > 0) fichesMixtes++;
    else fichesToutesTierces++;
  }
  console.log("fiches dont TOUTES les photos viennent de notre compartiment :", fichesToutesDuPro.length);
  console.log("fiches mixtes :", fichesMixtes, "| fiches 100% Google Places :", fichesToutesTierces);
  console.log("detail des fiches exploitables :", JSON.stringify(fichesToutesDuPro, null, 1));
  const claimedAvecPhoto = rows.filter(r => r.claimed_by_user_id).length;
  console.log("parmi les 203 fiches a photo, combien sont reclamees :", claimedAvecPhoto);
}
main().catch(e => console.error(e.message));
