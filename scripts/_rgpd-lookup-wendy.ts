/** RGPD lookup : trouver la fiche de Wendy (anaellewendy@live.fr) avant suppression. Read-only. */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

(async () => {
  const cols =
    "id, slug, name, siret, email, phone, city_id, category_id, is_active, deleted_at, claimed_by_user_id, source";

  // 1. Par email exact
  const byEmail = await sb.from("pros").select(cols).ilike("email", "anaellewendy@live.fr");
  // 2. Par nom (Sirene = majuscules sans accent en général)
  const byWendy = await sb.from("pros").select(cols).ilike("name", "%wendy%").limit(50);
  const byAnaelle = await sb.from("pros").select(cols).ilike("name", "%anaelle%").limit(50);

  const seen = new Map<number, any>();
  for (const src of [byEmail.data, byWendy.data, byAnaelle.data]) {
    for (const r of (src || []) as any[]) seen.set(r.id, r);
  }
  const rows = [...seen.values()];

  console.log(`=== Candidats (email OU nom contient wendy/anaelle) : ${rows.length} ===\n`);
  for (const r of rows) {
    console.log(
      `id=${r.id} | slug=${r.slug} | name="${r.name}" | siret=${r.siret} | cat=${r.category_id} | email=${r.email} | active=${r.is_active} | deleted=${r.deleted_at ? "OUI" : "non"} | claimed=${r.claimed_by_user_id ? "OUI" : "non"} | source=${r.source}`
    );
  }
  if (rows.length === 0) {
    console.log("Aucun candidat. La fiche a peut-être un autre nom (nom commercial) ou email null.");
  }
})();
