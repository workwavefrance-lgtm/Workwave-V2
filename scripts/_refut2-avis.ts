import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

async function main() {
  const sb = getServiceClient();

  // 1. pro_reviews : combien de lignes ?
  const r1 = await sb.from("pro_reviews").select("*", { count: "exact", head: true });
  console.log("pro_reviews total :", r1.count, r1.error?.message ?? "");

  const r2 = await sb.from("pro_reviews").select("*", { count: "exact", head: true }).eq("status", "published");
  console.log("pro_reviews published :", r2.count, r2.error?.message ?? "");

  // 2. avis GOOGLE deja en base (colonnes google_rating / google_reviews_count)
  const g1 = await sb.from("pros").select("*", { count: "exact", head: true })
    .gt("google_reviews_count", 0).gt("google_rating", 0);
  console.log("pros avec avis Google (count>0 ET rating>0) :", g1.count, g1.error?.message ?? "");

  const g2 = await sb.from("pros").select("*", { count: "exact", head: true })
    .gt("google_reviews_count", 0).gt("google_rating", 0)
    .eq("is_active", true).is("deleted_at", null);
  console.log("  dont actives non supprimees :", g2.count, g2.error?.message ?? "");

  const g3 = await sb.from("pros").select("*", { count: "exact", head: true })
    .gt("google_reviews_count", 0).gt("google_rating", 0)
    .eq("is_active", true).is("deleted_at", null).neq("etat_admin", "F");
  console.log("  dont OUVERTES (etat_admin <> F) :", g3.count, g3.error?.message ?? "");

  // somme des avis Google
  let offset = 0; let totalAvis = 0; let n = 0; let sommeNote = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await sb.from("pros")
      .select("google_rating,google_reviews_count")
      .gt("google_reviews_count", 0).gt("google_rating", 0)
      .eq("is_active", true).is("deleted_at", null)
      .range(offset, offset + PAGE - 1);
    if (error) { console.log("err page", error.message); break; }
    const rows = data || [];
    if (rows.length === 0) break;
    for (const r of rows as any[]) { totalAvis += r.google_reviews_count; sommeNote += r.google_rating; n++; }
    offset += rows.length;
    if (offset > 100000) break;
  }
  console.log(`avis Google agreges : ${totalAvis} avis repartis sur ${n} fiches, note moyenne ${(sommeNote/Math.max(n,1)).toFixed(2)}`);
}
main();
