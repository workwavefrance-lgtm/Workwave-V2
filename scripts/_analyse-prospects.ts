import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
type L = Record<string, string>;
const rows: L[] = JSON.parse(fs.readFileSync("/tmp/prep.json", "utf8"));

(async () => {
  const avecEmail = rows.filter((r) => r.email);
  const emails = new Map<string, L[]>();
  avecEmail.forEach((r) => { const k = r.email.toLowerCase(); emails.set(k, [...(emails.get(k) || []), r]); });
  const belge = (r: L) => /\(\d{4}\)/.test(r.ville);

  console.log(`lignes                       : ${rows.length}`);
  console.log(`avec email                   : ${avecEmail.length}`);
  console.log(`adresses email UNIQUES       : ${emails.size}`);
  console.log(`  dont partagees (>1 ligne)  : ${[...emails.values()].filter((v) => v.length > 1).length}`);
  console.log(`avec telephone               : ${rows.filter((r) => r.telephone).length}`);
  console.log(`Belgique / France            : ${rows.filter(belge).length} / ${rows.filter((r) => !belge(r)).length}`);
  console.log(`  emails Belgique / France   : ${avecEmail.filter(belge).length} / ${avecEmail.filter((r) => !belge(r)).length}`);

  const projets = [...new Set(rows.map((r) => Number(r.projet_id)))];
  console.log(`\nprojets cites : ${projets.length}`);
  const { data, error } = await sb.from("projects").select("id, status").in("id", projets);
  if (error) { console.error("ERREUR:", error.message); process.exit(1); }
  const parStatut = new Map<string, number>();
  (data || []).forEach((p: any) => parStatut.set(p.status, (parStatut.get(p.status) || 0) + 1));
  console.log("statut REEL en base :");
  for (const [s, n] of parStatut) console.log(`   ${String(s).padEnd(10)} ${String(n).padStart(3)}`);

  const ouverts = new Set((data || []).filter((p: any) => !["closed", "deleted"].includes(p.status)).map((p: any) => p.id));
  const envoyables = avecEmail.filter((r) => ouverts.has(Number(r.projet_id)));
  console.log(`\nEMAILS SUR UN CHANTIER ENCORE OUVERT : ${envoyables.length}`);
  console.log(`adresses uniques correspondantes     : ${new Set(envoyables.map((r) => r.email.toLowerCase())).size}`);

  // Anti-doublon RGPD : une meme adresse peut servir plusieurs entreprises.
  const partagees = [...emails.entries()].filter(([, v]) => new Set(v.map((r) => r.entreprise)).size > 1);
  console.log(`\nadresses utilisees par PLUSIEURS entreprises differentes : ${partagees.length}`);
  partagees.slice(0, 5).forEach(([e, v]) => console.log(`   ${e} -> ${[...new Set(v.map((r) => r.entreprise))].join(" | ")}`));
})();
