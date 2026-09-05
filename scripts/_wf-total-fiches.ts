import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb: any = getServiceClient();

// sitemap_batch_start_id(skip_count, tech_mode) renvoie l'id de la ligne a
// l'offset skip_count (ordre id) parmi les fiches actives du perimetre, ou
// NULL si l'offset depasse le total. Recherche dichotomique -> total exact.
async function offsetExiste(skip: number, tech: boolean): Promise<boolean> {
  for (let i = 0; i < 5; i++) {
    const { data, error } = await sb.rpc("sitemap_batch_start_id", { skip_count: skip, tech_mode: tech });
    if (!error) return data !== null;
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("RPC en echec a skip=" + skip);
}

async function total(tech: boolean, label: string) {
  let bas = 0, haut = 1;
  while (await offsetExiste(haut, tech)) { bas = haut; haut *= 2; if (haut > 10_000_000) break; }
  // total = plus petit skip qui n'existe pas ; offset skip existe <=> skip < total
  while (haut - bas > 1) {
    const mid = Math.floor((bas + haut) / 2);
    if (await offsetExiste(mid, tech)) bas = mid; else haut = mid;
  }
  // bas = dernier offset valide -> total = bas + 1
  console.log(`${label} = ${bas + 1}`);
  return bas + 1;
}

(async () => {
  const nonTech = await total(false, "fiches ACTIVES non tech (perimetre sitemap /artisan)");
  const tech = await total(true, "fiches ACTIVES tech (perimetre sitemap /ai/freelance)");
  console.log("tranches necessaires non tech :", Math.ceil(nonTech / 45000));
  console.log("tranches necessaires tech    :", Math.ceil(tech / 45000));
  console.log("total actifs (somme)         :", nonTech + tech);
})();
