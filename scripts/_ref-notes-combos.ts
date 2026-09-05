import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const rows: any[] = []; let off = 0;
  while (true) {
    const { data, error } = await sb.from("pros")
      .select("category_id, city_id, google_rating, google_reviews_count, is_active, deleted_at, etat_admin")
      .not("google_rating", "is", null).range(off, off + 999);
    if (error) { console.log("ERR", error.message); break; }
    const r = data || []; if (!r.length) break; rows.push(...r); off += r.length;
  }
  console.log("pros avec google_rating :", rows.length);
  const actifs = rows.filter(r => r.is_active && !r.deleted_at);
  console.log("  dont actifs non supprimes :", actifs.length);
  console.log("  dont etat_admin <> F :", actifs.filter(r => r.etat_admin !== "F").length);
  const combos = new Set(actifs.filter(r=>r.etat_admin!=="F").map(r => `${r.category_id}|${r.city_id}`));
  console.log("combos (categorie x ville) couverts par au moins 1 note :", combos.size);
  const avecCount = actifs.filter(r => r.google_reviews_count && r.google_reviews_count > 0);
  console.log("pros actifs avec note ET nombre d avis > 0 :", avecCount.length);
})();
