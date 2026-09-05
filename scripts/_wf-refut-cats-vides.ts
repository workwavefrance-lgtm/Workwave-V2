import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function compte(cat: number) {
  for (let essai = 0; essai < 3; essai++) {
    const r = await sb.from("pros").select("id", { count: "exact", head: true }).eq("category_id", cat);
    if (!r.error) return r.count;
    if (essai === 2) return `ERREUR ${r.error.message}`;
    await new Promise((res) => setTimeout(res, 4000));
  }
}
async function main() {
  const cats: [number, string][] = [
    [36, "pisciniste"], [199, "ascensoriste"], [5, "menuisier"], [11, "serrurier"],
    [37, "vitrier"], [12, "chauffagiste"], [13, "climaticien"], [38, "ramoneur"],
  ];
  for (const [id, nom] of cats) {
    const c = await compte(id);
    console.log(`cat ${id} ${nom} : ${c === null ? "NULL (erreur, pas zero)" : c} lignes en base (national, tous etats)`);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
