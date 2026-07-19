import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const { data: all } = await sb.from("categories").select("id, vertical");
  const { data, error } = await sb.from("categories").select("id, name, vertical").in("vertical", ["btp","domicile","personne"]).order("name");
  if (error) { console.log("ERREUR:", error.message); process.exit(1); }
  const rows = (data || []) as { id: number; name: string; vertical: string }[];
  const allRows = (all || []) as { vertical: string }[];
  console.log("Total categories en base        :", allRows.length);
  console.log("Retournees par le selecteur     :", rows.length);
  console.log("Verticaux du selecteur          :", [...new Set(rows.map(r=>r.vertical))].sort().join(", "));
  console.log("Tous les verticaux existants    :", [...new Set(allRows.map(r=>r.vertical))].sort().join(", "));
  console.log("Exemples                        :", rows.slice(0,6).map(r=>r.name).join(" / "));
  if (rows.length < 20) { console.log("\nECHEC: trop peu de categories -> selecteur casse"); process.exit(1); }
  console.log("\nOK selecteur de categories valide");
})();
