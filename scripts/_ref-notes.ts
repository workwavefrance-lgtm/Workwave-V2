import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function main() {
  // 1) Comptage EXACT par requete filtree (pas d'echantillon)
  const cnt = async (label: string, build: (q: any) => any) => {
    let q = sb.from("pros").select("id", { count: "exact", head: true })
      .is("deleted_at", null).eq("is_active", true);
    q = build(q);
    const { count, error } = await q;
    console.log(label.padEnd(46), error ? "ERR " + error.message : count);
  };
  await cnt("pros actifs (toutes)", (q) => q);
  await cnt("pros actifs OUVERTS", (q) => q.or("etat_admin.is.null,etat_admin.neq.F"));
  await cnt("google_rating NOT NULL (toutes)", (q) => q.not("google_rating", "is", null));
  await cnt("google_rating NOT NULL + OUVERTS", (q) =>
    q.not("google_rating", "is", null).or("etat_admin.is.null,etat_admin.neq.F"));
  await cnt("google_reviews_count > 0", (q) => q.gt("google_reviews_count", 0));
  await cnt("workwave_reviews_count > 0", (q) => q.gt("workwave_reviews_count", 0));
  await cnt("claimed (fiche reclamee)", (q) => q.not("claimed_by_user_id", "is", null));
}
main().catch((e) => console.error(e.message));
