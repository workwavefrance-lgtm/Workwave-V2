import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { rechercherParSiret } from "@/lib/utils/recherche-entreprises";
(async () => {
  const sb = getServiceClient();
  const N = 200, MAX_ID = 4_300_000;
  const fiches: { id: number; siret: string; category_id: number }[] = [];
  const vus = new Set<number>();
  while (fiches.length < N) {
    const r = Math.floor(Math.random() * MAX_ID);
    const { data } = await sb.from("pros").select("id, siret, category_id").eq("is_active", true).is("deleted_at", null).not("siret", "is", null).gte("id", r).order("id").limit(1);
    const f = data?.[0]; if (f && !vus.has(f.id)) { vus.add(f.id); fiches.push(f); }
  }
  let ferme = 0, actif = 0, nonTrouve = 0, erreur = 0, i = 0, demenage = 0, disparu = 0;
  await Promise.all(Array.from({ length: 5 }, async () => {
    while (i < fiches.length) {
      const f = fiches[i++];
      const r = await rechercherParSiret(f.siret);
      if (r.statut === "ok") { const e = r.etablissement?.etat_administratif ?? (r.unite as { etat_administratif?: string })?.etat_administratif; if (e === "F") { ferme++; if ((r.unite as { etat_administratif?: string }).etat_administratif === "A") demenage++; else disparu++; } else actif++; }
      else if (r.statut === "non_trouve") nonTrouve++; else erreur++;
      await new Promise((res) => setTimeout(res, 1000));
    }
  }));
  console.log(`echantillon aleatoire ${N} fiches actives : actives ${actif} · FERMEES ${ferme} (${(100 * ferme / N).toFixed(0)} %) · dont entreprise encore ACTIVE ailleurs ${demenage}, entreprise DISPARUE ${disparu} · non trouvees ${nonTrouve} · erreurs API ${erreur}`);
})();
