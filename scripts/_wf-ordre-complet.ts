import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main() {
  const { data } = await sb.from("categories").select("id, slug, vertical");
  const rows = data || [];
  console.log("total lu :", rows.length);
  // positions ou l'id decroit
  const desordre: string[] = [];
  for (let i=1;i<rows.length;i++) if (rows[i].id < rows[i-1].id) desordre.push(`idx${i}: ${rows[i-1].id}->${rows[i].id} (${rows[i].slug}/${rows[i].vertical})`);
  console.log("nb de ruptures d'ordre croissant :", desordre.length);
  console.log(desordre.slice(0,20).join("\n"));
  // ordre relatif des BTP dans cette lecture non filtree
  const btp = rows.filter(r => r.vertical === "btp").map(r => r.id);
  const trie = [...btp].sort((a,b)=>a-b);
  console.log("\nBTP dans la lecture NON filtree :", btp.join(","));
  console.log("BTP en ordre croissant ?", JSON.stringify(btp)===JSON.stringify(trie));
  console.log("verticaux des ids 20,24,29 :", rows.filter(r=>[20,24,29].includes(r.id)).map(r=>`${r.id}=${r.slug}/${r.vertical}`).join(" "));
}
main();
