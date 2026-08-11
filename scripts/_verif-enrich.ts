import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });

// On PAGINE : le count exact echoue en silence sur cette table de 2,5 M de lignes.
async function compter(filtre: (q: any) => any, plafond = 60000) {
  let n = 0, offset = 0;
  for (;;) {
    const { data, error } = await filtre(sb.from("pros").select("id")).range(offset, offset + 999);
    if (error) { console.error("ERREUR:", error.message); process.exit(1); }
    const rows = data || [];
    if (rows.length === 0) break;
    n += rows.length; offset += rows.length;
    if (offset >= plafond) return -n;
  }
  return n;
}
(async () => {
  const avecNote = await compter((q: any) => q.not("google_rating", "is", null));
  const traitees = await compter((q: any) => q.not("google_enriched_at", "is", null));
  const restantes = await compter((q: any) =>
    q.eq("is_active", true).is("deleted_at", null).is("google_enriched_at", null)
     .or("phone.not.is.null,website.not.is.null"));
  const f = (n: number) => (n < 0 ? `plus de ${(-n).toLocaleString("fr")}` : n.toLocaleString("fr"));
  console.log(`fiches avec une note Google   : ${f(avecNote)}`);
  console.log(`fiches deja passees au script : ${f(traitees)}`);
  console.log(`fiches restant a traiter      : ${f(restantes)}`);
})();
