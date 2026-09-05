// Estime le nombre de couples (metier, ville) ayant au moins 1 pro OUVERT.
import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main() {
  const sb = getServiceClient();
  // Comptage exact sur un echantillon de 40 communes tirees au hasard.
  const { data: villes } = await sb.from("cities").select("id,slug").limit(1000).range(0, 999);
  const tir = [] as any[];
  for (let i = 0; i < 40; i++) tir.push(villes![Math.floor(Math.random() * villes!.length)]);
  let couples = 0, pros = 0;
  for (const v of tir) {
    const { data } = await sb.from("pros").select("category_id")
      .eq("city_id", v.id).eq("is_active", true).is("deleted_at", null).eq("etat_admin", "A").limit(1000);
    const c = new Set((data || []).map((x: any) => x.category_id));
    couples += c.size; pros += (data || []).length;
  }
  console.log(`40 communes tirees : ${pros} pros ouverts, ${couples} couples (metier, ville) distincts`);
  console.log(`  moyenne pros ouverts par couple : ${(pros/couples).toFixed(2)}`);
  console.log(`  => estimation nationale des couples avec >=1 pro ouvert : ${Math.round(1233038/(pros/couples)).toLocaleString("fr-FR")}`);
  console.log(`  (pages /[metier]/[ville] au sitemap aujourd hui : 7 639)`);
}
main();
