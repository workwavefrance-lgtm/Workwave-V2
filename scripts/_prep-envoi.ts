import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
type L = Record<string, string>;
const rows: L[] = JSON.parse(fs.readFileSync("/tmp/prep.json", "utf8"));

(async () => {
  const ids = [...new Set(rows.map((r) => Number(r.projet_id)))];
  const { data: pr } = await sb.from("projects")
    .select("id, status, description, urgency, budget_range, created_at, categories(name), cities(name, postal_code)")
    .in("id", ids);
  console.log("=== LES 4 CHANTIERS ===");
  for (const p of (pr || []) as any[]) {
    const n = rows.filter((r) => Number(r.projet_id) === p.id).length;
    const e = rows.filter((r) => Number(r.projet_id) === p.id && r.email).length;
    console.log(`\n#${p.id}  ${p.categories?.name} a ${p.cities?.name} (${p.cities?.postal_code})`);
    console.log(`   depose le ${String(p.created_at).slice(0, 10)} · urgence ${p.urgency} · budget ${p.budget_range}`);
    console.log(`   description : ${p.description ? JSON.stringify(String(p.description).slice(0, 160)) : "(vide)"}`);
    console.log(`   pros dans le CSV : ${n}  dont ${e} avec email`);
  }

  // Exclusions obligatoires
  const mails = [...new Set(rows.filter((r) => r.email).map((r) => r.email.toLowerCase()))];
  const { data: bl } = await sb.from("email_blacklist").select("email").in("email", mails);
  const blSet = new Set((bl || []).map((b: any) => String(b.email).toLowerCase()));
  const { data: dnc } = await sb.from("pros").select("email, do_not_contact, email_bounced, claimed_by_user_id")
    .in("email", mails);
  const stop = new Set<string>(); const dejaInscrit = new Set<string>();
  (dnc || []).forEach((p: any) => {
    const e = String(p.email || "").toLowerCase();
    if (p.do_not_contact || p.email_bounced) stop.add(e);
    if (p.claimed_by_user_id) dejaInscrit.add(e);
  });
  console.log(`\n=== EXCLUSIONS ===`);
  console.log(`liste noire            : ${blSet.size}`);
  console.log(`do_not_contact/bounced : ${stop.size}`);
  console.log(`deja inscrits (fiche reclamee) : ${dejaInscrit.size}`);
  const final = mails.filter((m) => !blSet.has(m) && !stop.has(m) && !dejaInscrit.has(m));
  console.log(`\nADRESSES REELLEMENT ENVOYABLES : ${final.length} sur ${mails.length}`);
  fs.writeFileSync("/tmp/envoyables.json", JSON.stringify(final, null, 0));
})();
