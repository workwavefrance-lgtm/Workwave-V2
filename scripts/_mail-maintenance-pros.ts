/**
 * Email d'avertissement AVANT les tests de migration : previent les artisans
 * ayant reclame leur fiche qu'ils peuvent voir passer des projets [TEST] et
 * qu'ils ne doivent surtout pas les debloquer (9,90 EUR pour rien).
 *
 *   npx tsx scripts/_mail-maintenance-pros.ts            # simulation (n'envoie rien)
 *   npx tsx scripts/_mail-maintenance-pros.ts --envoyer  # envoi reel
 *
 * Garde-fous : exclut les comptes de test de Willy, les do_not_contact, les
 * emails en erreur, et deduplique par adresse. Trace chaque envoi dans un
 * fichier JSON (idempotence : un re-lancement ne renvoie pas aux deja servis).
 */
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const ENVOYER = process.argv.includes("--envoyer");
const TRACE = path.resolve(process.cwd(), "scripts/.maintenance-mail-envoyes.json");

// Comptes de Willy (ne pas s'auto-envoyer l'avertissement)
const EXCLUS_NOM = /^(willy gauvrit|atsaf)$/i;

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
const resend = new Resend(process.env.RESEND_API_KEY!);

const SUJET = "Workwave.fr · petite intervention technique ce week-end";

const TEXTE = `Bonjour,

Je vous ecris parce que vous faites partie des artisans qui ont reclame leur
fiche sur Workwave.fr, donc vous etes directement concerne.

Ce week-end, je change le serveur qui heberge le site. L'objectif : des pages
beaucoup plus rapides (les fiches passent de 0,7 seconde a moins de 0,1).
Vous n'avez rien a faire, votre fiche et votre compte restent en place.

Un seul point d'attention :

/!\\ Pendant les tests, vous pourriez recevoir 2 ou 3 projets de TEST.
Ils porteront la mention [TEST] dans le titre.

   - Ne les debloquez pas (ce serait 9,90 EUR pour rien)
   - N'appelez pas les coordonnees qu'ils contiennent
   - Vous pouvez simplement les ignorer

Les vrais projets, eux, continuent d'arriver normalement.

Si vous avez le moindre doute sur un projet recu, repondez a cet email,
je vous reponds directement.

Merci de votre patience,

Willy
Workwave.fr
contact@workwave.fr`;

const HTML = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#0A0A0A;max-width:560px">
  <p>Bonjour,</p>
  <p>Je vous écris parce que vous faites partie des artisans qui ont <b>réclamé leur fiche</b> sur Workwave.fr, donc vous êtes directement concerné.</p>
  <p>Ce week-end, je change le serveur qui héberge le site. L'objectif : des pages beaucoup plus rapides (les fiches passent de 0,7 seconde à moins de 0,1). <b>Vous n'avez rien à faire</b>, votre fiche et votre compte restent en place.</p>
  <div style="background:#FFF4F1;border:1px solid #FFD5C9;border-radius:12px;padding:16px 18px;margin:22px 0">
    <p style="margin:0 0 10px;font-weight:700;color:#C43D18">⚠️ Un seul point d'attention</p>
    <p style="margin:0 0 10px">Pendant les tests, vous pourriez recevoir <b>2 ou 3 projets de TEST</b>. Ils porteront la mention <b>[TEST]</b> dans le titre.</p>
    <ul style="margin:0;padding-left:20px">
      <li><b>Ne les débloquez pas</b> (ce serait 9,90 € pour rien)</li>
      <li>N'appelez pas les coordonnées qu'ils contiennent</li>
      <li>Vous pouvez simplement les ignorer</li>
    </ul>
  </div>
  <p>Les vrais projets, eux, continuent d'arriver normalement.</p>
  <p>Si vous avez le moindre doute sur un projet reçu, <b>répondez à cet email</b>, je vous réponds directement.</p>
  <p>Merci de votre patience,</p>
  <p style="margin-top:22px">Willy<br>
    <span style="color:#6B7280">Workwave.fr · contact@workwave.fr</span></p>
</div>`;

type Pro = { id: number; name: string | null; email: string | null; do_not_contact: boolean | null; email_bounced: boolean | null };

async function main() {
  const { data, error } = await sb
    .from("pros")
    .select("id,name,email,do_not_contact,email_bounced")
    .not("claimed_by_user_id", "is", null)
    .eq("is_active", true)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);

  const deja: string[] = fs.existsSync(TRACE) ? JSON.parse(fs.readFileSync(TRACE, "utf8")) : [];
  const vus = new Set<string>();
  const cibles = (data as Pro[])
    .filter((p) => p.email && !p.do_not_contact && !p.email_bounced)
    .filter((p) => !EXCLUS_NOM.test((p.name || "").trim()))
    .filter((p) => {
      const e = p.email!.toLowerCase().trim();
      if (vus.has(e) || deja.includes(e)) return false;
      vus.add(e);
      return true;
    });

  console.log(`\n  Destinataires : ${cibles.length}${deja.length ? `  (${deja.length} deja servis, ignores)` : ""}`);
  cibles.forEach((p) => console.log(`   - ${(p.name || "?").slice(0, 34).padEnd(36)} ${p.email}`));

  if (!ENVOYER) {
    console.log("\n  SIMULATION : aucun email envoye. Relancer avec --envoyer\n");
    return;
  }

  console.log("\n  Envoi en cours...\n");
  const envoyes = [...deja];
  let ok = 0, ko = 0;
  for (const p of cibles) {
    try {
      const r = await resend.emails.send({
        from: "Workwave <contact@workwave.fr>",
        replyTo: process.env.ADMIN_EMAIL || "contact@workwave.fr",
        to: [p.email!],
        subject: SUJET,
        text: TEXTE,
        html: HTML,
      });
      if (r.error) throw new Error(r.error.message);
      ok++;
      envoyes.push(p.email!.toLowerCase().trim());
      console.log(`   OK  ${p.email}`);
    } catch (e) {
      ko++;
      console.log(`   ECHEC ${p.email} : ${(e as Error).message}`);
    }
    fs.writeFileSync(TRACE, JSON.stringify(envoyes, null, 2));
    await new Promise((r) => setTimeout(r, 600)); // limite de debit Resend
  }
  console.log(`\n  ${ok} envoyes · ${ko} echecs\n`);
}

main().catch((e) => {
  console.error("ERREUR", e.message);
  process.exit(1);
});
