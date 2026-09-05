/**
 * Le sitemap en production (48 tranches de 45 000) suffit-il encore ?
 *
 * Un comptage direct depasse le delai sur 2,7 M de lignes. On interroge la
 * fonction que le sitemap utilise lui-meme : `sitemap_batch_start_id(n, tech)`
 * renvoie NULL quand n depasse le nombre de lignes, sinon l'id de depart. Elle
 * s'appuie sur l'index partiel idx_pros_active_id_cat et coute quelques
 * millisecondes. Repondre « y a-t-il au moins n lignes ? » suffit ici.
 */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const PAR = 45000;
const auMoins = async (n: number, tech: boolean) => {
  const r = await (sb as any).rpc("sitemap_batch_start_id", { skip_count: n, tech_mode: tech });
  if (r.error) throw new Error(r.error.message || "delai depasse");
  return r.data !== null;
};
(async () => {
  console.log("  tranches de 45 000 fiches NON TECH reellement remplies :");
  let derniere = 0;
  for (let t = 40; t <= 62; t++) {
    const ok = await auMoins(t * PAR, false);
    if (!ok) { derniere = t; break; }
    derniere = t + 1;
  }
  console.log(`    au moins ${derniere - 1} tranches pleines, la ${derniere}e est entamee ou vide`);
  console.log(`\n  PRODUCTION declare 48 tranches (${48 * PAR} places)`);
  console.log(`  CODE (non deploye) declare 60 tranches (${60 * PAR} places)`);
  const deborde = await auMoins(48 * PAR, false);
  console.log(deborde
    ? `\n  🔴 IL Y A DES FICHES AU-DELA DE LA 48e TRANCHE : elles sont ecrites, servies, mais ABSENTES du sitemap de production. Invisibles de Google tant qu'on n'a pas redeploye.`
    : `\n  la production tient encore : rien au-dela de la 48e tranche.`);
  const deborde60 = await auMoins(60 * PAR, false);
  console.log(deborde60
    ? `  ⚠️ et il y en a meme au-dela de la 60e : relever encore la borne avant de deployer.`
    : `  apres deploiement, la borne de 60 couvre tout.`);
})();
