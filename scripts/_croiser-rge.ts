/**
 * Croisement RGE (ADEME, Licence Ouverte) x fiches pros, par SIRET EXACT.
 * AUCUNE ECRITURE : mesure seulement. L'ecriture sera un script separe.
 */
import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });

(async () => {
  const lignes = fs.readFileSync("/tmp/rge/rge-actuel.csv", "utf8").trim().split("\n").slice(1);
  const rge = new Map<string, { tel: string; mail: string; web: string }>();
  for (const l of lignes) {
    const [siret, , tel, mail, web] = l.split(";");
    if (siret) rge.set(siret, { tel: tel || "", mail: mail || "", web: web || "" });
  }
  console.log(`RGE charge : ${rge.size} SIRET`);

  const sirets = [...rge.keys()];
  let matches = 0, gagneTel = 0, gagneMail = 0, dejaTel = 0, dejaMail = 0;
  for (let i = 0; i < sirets.length; i += 500) {
    const bloc = sirets.slice(i, i + 500);
    const { data, error } = await sb.from("pros")
      .select("id, siret, phone, email")
      .in("siret", bloc).eq("is_active", true).is("deleted_at", null);
    if (error) { console.error("ERREUR:", error.message); process.exit(1); }
    for (const p of (data || []) as any[]) {
      matches++;
      const r = rge.get(p.siret)!;
      if (p.phone) dejaTel++; else if (r.tel) gagneTel++;
      if (p.email) dejaMail++; else if (r.mail) gagneMail++;
    }
    if ((i / 500) % 24 === 0) console.log(`  ${i + bloc.length}/${sirets.length} testes, ${matches} matchs...`);
  }
  console.log(`\nFICHES WORKWAVE RETROUVEES PAR SIRET : ${matches} / ${rge.size}`);
  console.log(`  telephones NOUVEAUX a ecrire : ${gagneTel}  (fiches sans aucun tel aujourd'hui)`);
  console.log(`  emails NOUVEAUX a ecrire     : ${gagneMail}`);
  console.log(`  avaient deja un tel / mail   : ${dejaTel} / ${dejaMail}`);
})();
