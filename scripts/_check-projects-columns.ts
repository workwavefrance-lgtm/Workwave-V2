import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Lire un row et lister les colonnes
  const { data } = await sb.from("projects").select("*").eq("id", 40).maybeSingle();
  console.log("Colonnes de la table projects (sample row):");
  if (data) {
    for (const k of Object.keys(data)) {
      console.log(`  - ${k}: ${typeof data[k]}`);
    }
  }
}
main().catch((e) => console.error(e));
