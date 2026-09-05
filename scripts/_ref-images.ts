import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

async function main() {
  const sb = getServiceClient();

  // 1) Combien de fiches ACTIVES + OUVERTES ont un logo_url ?
  const q1 = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null)
    .not("logo_url", "is", null);
  console.log("pros actifs avec logo_url non null :", q1.count, q1.error?.message ?? "");

  // 2) Combien ont des photos non vides ?
  const q2 = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null)
    .neq("photos", "[]");
  console.log("pros actifs avec photos != [] :", q2.count, q2.error?.message ?? "");

  // 3) Total actif
  const q3 = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null);
  console.log("total pros actifs :", q3.count, q3.error?.message ?? "");

  // 4) Provenance des photos : echantillon des lignes qui en ont
  const q4 = await sb.from("pros").select("id, slug, logo_url, photos, city_id, category_id")
    .eq("is_active", true).is("deleted_at", null)
    .neq("photos", "[]").limit(1000);
  const rows = q4.data ?? [];
  let googleapis = 0, supa = 0, autre = 0, total = 0;
  for (const r of rows) {
    const ph = (r.photos as unknown as string[]) ?? [];
    for (const p of ph) {
      total++;
      const s = typeof p === "string" ? p : JSON.stringify(p);
      if (s.includes("googleapis.com")) googleapis++;
      else if (s.includes("supabase.co")) supa++;
      else autre++;
    }
  }
  console.log(`\nprovenance photos (echantillon ${rows.length} fiches, ${total} photos) : googleapis=${googleapis} supabase=${supa} autre=${autre}`);

  // 5) provenance des logos
  const q5 = await sb.from("pros").select("logo_url")
    .eq("is_active", true).is("deleted_at", null)
    .not("logo_url", "is", null).limit(1000);
  const lg = q5.data ?? [];
  const host: Record<string, number> = {};
  for (const r of lg) {
    try { const h = new URL(r.logo_url as string).hostname; host[h] = (host[h] ?? 0) + 1; }
    catch { host["(non-url)"] = (host["(non-url)"] ?? 0) + 1; }
  }
  console.log("hosts logo_url (echantillon " + lg.length + ") :", host);
}
main().catch((e) => { console.error(e); process.exit(1); });
