import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main() {
  const { data: logos } = await sb.from("pros")
    .select("id,slug,name,logo_url,city_id,category_id,cities(slug,name),categories(slug)")
    .is("deleted_at", null).eq("is_active", true).not("logo_url","is",null).limit(40);
  console.log("=== FICHES AVEC LOGO (", logos?.length, ") ===");
  for (const p of logos ?? []) {
    const c: any = p.cities, k: any = p.categories;
    console.log(`id=${p.id} /${k?.slug}/${c?.slug}  ${p.name}  logo=${String(p.logo_url).slice(0,60)}`);
  }
  const { data: ph } = await sb.from("pros")
    .select("id,slug,photos,cities(slug),categories(slug)")
    .is("deleted_at", null).eq("is_active", true).neq("photos","[]").not("photos","is",null).limit(300);
  const rows = ph ?? [];
  console.log("\n=== FICHES AVEC PHOTOS :", rows.length, "===");
  let places = 0, bucket = 0, autre = 0, total = 0;
  const idBuckets: Record<string, number> = {};
  for (const r of rows) {
    const arr: any[] = Array.isArray(r.photos) ? r.photos : [];
    total += arr.length;
    for (const p of arr) {
      const u = typeof p === "string" ? p : (p?.url ?? p?.src ?? "");
      if (String(u).includes("googleapis.com") || String(u).includes("googleusercontent")) places++;
      else if (String(u).includes("supabase")) bucket++;
      else autre++;
    }
    const b = String(Math.floor(r.id / 100000) * 100000);
    idBuckets[b] = (idBuckets[b] ?? 0) + 1;
  }
  console.log("photos totales :", total, "| google places :", places, "| notre bucket :", bucket, "| autre :", autre);
  console.log("repartition par tranche d'id :", idBuckets);
  const withKey = rows.filter(r => JSON.stringify(r.photos).includes("key=AIza")).length;
  console.log("fiches dont une photo porte key=AIza dans l'URL :", withKey);
}
main().catch(e => console.error(e.message));
