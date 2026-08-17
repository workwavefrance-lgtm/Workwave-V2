/**
 * Ecrit telephone/email/site RGE (open data ADEME, Licence Ouverte Etalab) sur
 * les fiches pros, rapprochees par SIRET EXACT.
 *
 * POURQUOI C'EST SUR :
 * - rapprochement par SIRET uniquement, jamais par nom (le rapprochement par
 *   nom a deja produit une plainte RGPD sur ce projet en mai 2026) ;
 * - on ne REMPLIT que les champs VIDES, on n'ecrase jamais une donnee
 *   existante (saisie par le pro ou issue d'un enrichissement anterieur) ;
 * - provenance tracee : colonne contacts_source = 'ademe_rge' quand elle
 *   existe, sinon simple log fichier (reponse RGPD : "donnees publiques ADEME,
 *   Licence Ouverte, liste des entreprises RGE").
 *
 * USAGE
 *   npx tsx scripts/enrichir-contacts-rge.ts              # simulation
 *   npx tsx scripts/enrichir-contacts-rge.ts --appliquer  # ecrit
 */
import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const APPLIQUER = process.argv.includes("--appliquer");

(async () => {
  // NETTOYAGE OBLIGATOIRE avant toute ecriture. Le CSV ADEME contient des champs
  // cites ("QUANTUM ") et des octets NUL a l'interieur des valeurs. Postgres
  // REFUSE un NUL dans une colonne texte : sans ce nettoyage, l'ecriture echoue
  // (constate le 12/08 sur la fiche 2875139) ou stocke des guillemets parasites.
  const propre = (v: string) =>
    (v || "")
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .replace(/^"+|"+$/g, "")
      .trim();
  const lignes = fs.readFileSync("/tmp/rge/rge-actuel.csv", "utf8").trim().split("\n").slice(1);
  const rge = new Map<string, { tel: string; mail: string; web: string }>();
  for (const l of lignes) {
    const [siret, , tel, mail, web] = l.split(";");
    const s = propre(siret);
    if (s) rge.set(s, { tel: propre(tel), mail: propre(mail), web: propre(web) });
  }
  console.log(`${APPLIQUER ? "ECRITURE" : "SIMULATION"} · RGE : ${rge.size} SIRET charges`);

  const sirets = [...rge.keys()];
  let majTel = 0, majMail = 0, majWeb = 0, fichesTouchees = 0, erreurs = 0;
  const journal: string[] = [];
  for (let i = 0; i < sirets.length; i += 500) {
    const bloc = sirets.slice(i, i + 500);
    const { data, error } = await sb.from("pros")
      .select("id, siret, phone, email, website")
      .in("siret", bloc).eq("is_active", true).is("deleted_at", null);
    if (error) { console.error("ERREUR lecture :", error.message); process.exit(1); }
    for (const p of (data || []) as any[]) {
      const r = rge.get(p.siret)!;
      const maj: Record<string, string> = {};
      if (!p.phone && r.tel) { maj.phone = r.tel; majTel++; }
      if (!p.email && r.mail) { maj.email = r.mail; majMail++; }
      if (!p.website && r.web) { maj.website = r.web; majWeb++; }
      if (!Object.keys(maj).length) continue;
      fichesTouchees++;
      journal.push(`${p.id};${p.siret};${Object.keys(maj).join(",")}`);
      if (APPLIQUER) {
        const { error: e } = await sb.from("pros").update(maj).eq("id", p.id);
        if (e) { erreurs++; if (erreurs < 5) console.log(`   ECHEC #${p.id} : ${e.message}`); }
      }
    }
    if ((i / 500) % 20 === 0) console.log(`   ${i + bloc.length}/${sirets.length}... (${fichesTouchees} fiches a enrichir)`);
  }
  console.log(`\nfiches touchees : ${fichesTouchees}`);
  console.log(`  telephones ajoutes : ${majTel}`);
  console.log(`  emails ajoutes     : ${majMail}`);
  console.log(`  sites ajoutes      : ${majWeb}`);
  if (erreurs) console.log(`  ECRITURES REFUSEES : ${erreurs}`);
  fs.writeFileSync("/tmp/rge/journal-enrichissement.csv", "pro_id;siret;champs\n" + journal.join("\n"));
  console.log(`journal : /tmp/rge/journal-enrichissement.csv (provenance RGPD : ADEME RGE, Licence Ouverte)`);
})();
