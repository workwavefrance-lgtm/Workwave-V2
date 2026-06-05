import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data } = await sb
    .from("pros")
    .select("id, name, photos, logo_url")
    .eq("id", 1432477)
    .maybeSingle();
  console.log("Pro 1432477:");
  console.log(`  photos: ${JSON.stringify(data?.photos)}`);
  console.log(`  logo_url: ${data?.logo_url}`);

  // Sample d'autres pros avec photos
  const { data: withPhotos } = await sb
    .from("pros")
    .select("id, name, photos")
    .neq("photos", "[]")
    .not("photos", "is", null)
    .limit(3);
  console.log("\nPros avec photos non vide (sample 3):");
  console.table(withPhotos);
}
main();
