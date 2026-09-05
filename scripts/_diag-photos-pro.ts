import { config } from "dotenv"; import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const url = (p: any) => (typeof p === "string" ? p : p?.url || "");
(async () => {
  const { data } = await sb.from("pros").select("id,slug,name,photos,claimed_by_user_id")
    .neq("photos", "[]").eq("is_active", true).is("deleted_at", null).limit(5000);
  const avec = (data || []).filter((p: any) => Array.isArray(p.photos) && p.photos.length > 0);
  let toutesDuPro = 0, toutesGoogle = 0, melange = 0, photosPro = 0, photosGoogle = 0;
  const exemples: string[] = [];
  for (const p of avec) {
    const u = p.photos.map(url);
    const nPro = u.filter((x: string) => x.includes("/pro-photos/")).length;
    const nG = u.length - nPro;
    photosPro += nPro; photosGoogle += nG;
    if (nPro === u.length) { toutesDuPro++; if (exemples.length < 5) exemples.push(`${p.slug} (${u.length} photos, reclamee: ${p.claimed_by_user_id ? "oui" : "non"})`); }
    else if (nPro === 0) toutesGoogle++;
    else melange++;
  }
  console.log(`fiches avec au moins une photo : ${avec.length}`);
  console.log(`  toutes les photos DU PRO     : ${toutesDuPro}   <- passeront en grand format`);
  console.log(`  toutes de Google Places      : ${toutesGoogle}`);
  console.log(`  melange des deux             : ${melange}`);
  console.log(`\nphotos du pro : ${photosPro} · photos Google : ${photosGoogle}`);
  console.log("\nexemples de fiches qui passeront en grand :");
  exemples.forEach((e) => console.log("   " + e));
})();
