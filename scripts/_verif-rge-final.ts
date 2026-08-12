/**
 * Verification FINALE de l'enrichissement RGE, EN BASE.
 * Regle du 08/08 : ne jamais conclure sur le log d'un script, toujours
 * re-interroger la base apres coup.
 */
import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });

(async () => {
  const j = fs.readFileSync("/tmp/rge/journal-enrichissement.csv","utf8").trim().split("\n").slice(1);
  const attendu = new Map<number,string>();
  for (const l of j) { const [id,,champs] = l.split(";"); attendu.set(Number(id), champs); }
  console.log(`journal : ${attendu.size} fiches censees etre enrichies`);

  const ids = [...attendu.keys()];
  let okTel = 0, okMail = 0, manquants: number[] = [];
  for (let i = 0; i < ids.length; i += 500) {
    const bloc = ids.slice(i, i + 500);
    const { data, error } = await sb.from("pros").select("id, phone, email").in("id", bloc);
    if (error) { console.error("ERREUR:", error.message); process.exit(1); }
    for (const p of (data||[]) as any[]) {
      const c = attendu.get(p.id) || "";
      const tOk = !c.includes("phone") || !!p.phone;
      const mOk = !c.includes("email") || !!p.email;
      if (c.includes("phone") && p.phone) okTel++;
      if (c.includes("email") && p.email) okMail++;
      if (!tOk || !mOk) manquants.push(p.id);
    }
  }
  console.log(`\nVERIFIE EN BASE :`);
  console.log(`  telephones effectivement ecrits : ${okTel}`);
  console.log(`  emails effectivement ecrits     : ${okMail}`);
  console.log(`  fiches incompletes              : ${manquants.length}${manquants.length ? " -> id " + manquants.slice(0,5).join(", ") : ""}`);

  // total joignable dans toute la base (pagination : count exact echoue sur 2,5 M)
  let joignables = 0, off = 0;
  for (;;) {
    const { data, error } = await sb.from("pros").select("id")
      .eq("is_active", true).is("deleted_at", null)
      .or("phone.not.is.null,email.not.is.null")
      .range(off, off + 999);
    if (error) { console.error("ERREUR total:", error.message); break; }
    const r = data || []; if (!r.length) break;
    joignables += r.length; off += r.length;
    if (off > 400000) { console.log("  (arret de securite)"); break; }
  }
  console.log(`\nFICHES JOIGNABLES DANS TOUTE LA BASE : ${joignables.toLocaleString("fr")}`);
})();
