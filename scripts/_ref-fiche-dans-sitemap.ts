import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const AI = [43,44,45,46,47,48,79,80,81,82,83,85,86,87];
(async () => {
  const sb = getServiceClient();
  for (const slug of ["ag2-plomberie-renovation-00023", "aissa-00013", "ajl-00017"]) {
    const { data, error } = await sb.from("pros").select("id, name, is_active, deleted_at, category_id, etat_admin").eq("slug", slug).limit(1);
    if (error) { console.log(slug, "erreur", error.message); continue; }
    const p: any = (data || [])[0];
    if (!p) { console.log(slug, "introuvable"); continue; }
    const { count } = await sb.from("pros").select("id", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null)
      .not("category_id", "in", `(${AI.join(",")})`)
      .lte("id", p.id)
      .abortSignal(AbortSignal.timeout(90000));
    const rang = count ?? -1;
    console.log(`${slug} | id=${p.id} actif=${p.is_active} supprime=${p.deleted_at} etat=${p.etat_admin} | rang sitemap=${rang} -> sous-sitemap /sitemap/${100 + Math.floor((rang - 1) / 45000)}.xml`);
  }
})();
