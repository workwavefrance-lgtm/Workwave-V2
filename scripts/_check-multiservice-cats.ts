import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
/* eslint-disable @typescript-eslint/no-explicit-any */
(async () => {
  const { data } = await sb.from("categories").select("id,slug,name,vertical").in("vertical", ["btp","domicile","personne"]).order("vertical").order("id");
  console.log("=== catégories BTP+domicile+personne ===");
  (data as any[]).forEach(c => console.log(`${String(c.id).padStart(3)} | ${c.vertical.padEnd(9)} | ${c.slug.padEnd(28)} | ${c.name}`));
  // pros multiservice / bricolage réclamés
  const mult = (data as any[]).filter(c => /multi|bricol|toutes-main|homme/i.test(c.slug + c.name));
  console.log("\n=== catégories 'multiservice/bricolage' détectées ===");
  mult.forEach(c => console.log(`  ${c.id} → ${c.slug} (${c.name})`));
})().catch(e => console.error(e.message));
