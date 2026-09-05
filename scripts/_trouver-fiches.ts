import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
// nom trouve sur le web -> on cherche la fiche correspondante EN BASE, filtree par VILLE
// (jamais par nom seul : sur 2,5 M de lignes les homonymes sont la regle)
const cibles = [
  ["JCL",           "Isle-Jourdain"],
  ["DOMI",          "Vendat"],
  ["BONNEAU",       "Vendat"],
  ["BLIN",          "Villeneuve-la-Guyard"],
  ["LEBOUCQ",       "Villeneuve-la-Guyard"],
  ["BOURREAU",      "Villeneuve-la-Guyard"],
];
(async () => {
  for (const [nom, ville] of cibles) {
    const { data, error } = await sb.from("pros")
      .select("id, name, slug, phone, email, claimed_by_user_id, categories(name), cities!inner(name)")
      .ilike("name", `%${nom}%`).ilike("cities.name", `%${ville}%`)
      .eq("is_active", true).is("deleted_at", null).limit(5);
    if (error) { console.log(`${nom} -> ERREUR ${error.message}`); continue; }
    if (!data?.length) { console.log(`${nom.padEnd(10)} ${ville.padEnd(22)} AUCUNE FICHE en base`); continue; }
    for (const p of data as any[])
      console.log(`${nom.padEnd(10)} ${ville.padEnd(22)} ${p.name.slice(0,30).padEnd(32)} ${p.categories?.name?.slice(0,14).padEnd(15)} ${p.claimed_by_user_id ? "DEJA RECLAMEE" : "libre"}  https://workwave.fr/artisan/${p.slug}`);
  }
})();
