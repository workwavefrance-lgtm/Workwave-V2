import * as dotenv from "dotenv"; import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  let off = 0, ouverts = 0, fermes = 0, avisOuverts = 0;
  while (true) {
    const { data, error } = await sb.from("pros")
      .select("etat_admin,google_reviews_count")
      .gt("google_reviews_count", 0).gt("google_rating", 0)
      .eq("is_active", true).is("deleted_at", null)
      .range(off, off + 999);
    if (error) { console.log(error.message); break; }
    const rows = (data || []) as any[];
    if (rows.length === 0) break;
    for (const r of rows) { if (r.etat_admin === "F") fermes++; else { ouverts++; avisOuverts += r.google_reviews_count; } }
    off += rows.length;
  }
  console.log(`fiches avec note+avis Google, actives : ${ouverts + fermes}`);
  console.log(`  OUVERTES : ${ouverts} (${avisOuverts} avis)`);
  console.log(`  FERMEES  : ${fermes}`);
})();
