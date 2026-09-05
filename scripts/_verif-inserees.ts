import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const depuis = new Date(Date.now() - 4 * 3600e3).toISOString();
  // Comptage borne : on lit les lignes plutot qu'un count exact (pas d'index
  // sur created_at, le count depasse le delai autorise).
  const lignes: any[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await sb.from("pros")
      .select("id, founding_date, forme_juridique, effectif_range, etat_admin, entreprise_etat")
      .gte("created_at", depuis).eq("etat_admin", "A").range(offset, offset + 999);
    if (error) { console.log("erreur :", error.message); break; }
    const r = data || []; if (!r.length) break;
    lignes.push(...r); offset += r.length;
  }
  const { data: f } = await sb.from("pros").select("id").gte("created_at", depuis).eq("etat_admin", "F").limit(5);
  const { data: n } = await sb.from("pros").select("id").gte("created_at", depuis).is("etat_admin", null).limit(5);
  const pc = (k: string) => `${lignes.filter((x) => x[k] != null).length} / ${lignes.length}`;
  console.log(`fiches ouvertes creees depuis 4 h : ${lignes.length}`);
  console.log(`  avec date de creation : ${pc("founding_date")}`);
  console.log(`  avec forme juridique  : ${pc("forme_juridique")}`);
  console.log(`  avec effectif         : ${pc("effectif_range")}`);
  console.log(`  entreprise active     : ${lignes.filter((x) => x.entreprise_etat === "A").length} / ${lignes.length}`);
  console.log(`\n  fiches FERMEES creees depuis 4 h : ${f?.length ?? 0}  <- doit etre 0`);
  console.log(`  fiches d'etat INCONNU creees     : ${n?.length ?? 0}  <- doit etre 0`);
})();
