import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import { getGeneralistCategoryIds, getAllBtpCategoryIds } from "../lib/matching/generalist";
import { getMatchCategoryIds } from "../lib/email/broadcast-btp-project";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const gen = await getGeneralistCategoryIds(sb as any);
  const allBtp = await getAllBtpCategoryIds(sb as any);
  console.log("Généralistes (attendu [188,22]) :", gen.sort((a,b)=>a-b));
  console.log(`Toutes catégories BTP : ${allBtp.length} ids →`, allBtp.sort((a,b)=>a-b).join(","));
  // Simulation broadcast : projet MAÇON (cat 3)
  const match = await getMatchCategoryIds(sb as any, 3);
  const target = [...new Set([...match, ...gen])].sort((a,b)=>a-b);
  console.log("\nProjet MAÇON (3) → pros ciblés :", target, target.includes(188) ? "✅ inclut multiservice" : "❌ RATÉ");
  // Simulation broadcast : projet PLOMBIER (cluster CVC)
  const matchP = await getMatchCategoryIds(sb as any, 1);
  const targetP = [...new Set([...matchP, ...gen])].sort((a,b)=>a-b);
  console.log("Projet PLOMBIER (1) → pros ciblés :", targetP, (targetP.includes(12)&&targetP.includes(188)) ? "✅ cluster CVC + multiservice" : "❌");
  // Simulation dashboard : pro MULTISERVICE (188) voit ?
  const isGen = gen.includes(188);
  console.log("\nPro MULTISERVICE connecté → voit tous les BTP ?", isGen ? `✅ oui (${allBtp.length} catégories)` : "❌");
})().catch(e => console.error("ERR", e.message));
