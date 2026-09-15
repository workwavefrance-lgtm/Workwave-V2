import { emailButton, emailContent, emailParagraph, renderEmail } from "@/lib/email/design";

/**
 * ANNONCE AUX PROS : leurs 2 premiers deblocages sont offerts.
 *
 * POURQUOI CE MAIL EXISTE
 * L'email de diffusion des chantiers (lib/email/broadcast-btp-project.ts)
 * annonce le prix de 9,90 EUR et ne mentionne NULLE PART que les deux premiers
 * deblocages sont gratuits. Mesure du 15/08 : sur 42 pros ayant un compte,
 * 37 n'ont jamais rien debloque. Ils voient donc un cout, jamais la gratuite.
 *
 * GARANTIES
 *  - JAMAIS DEUX FOIS. Chaque envoi ecrit une ligne dans `events`
 *    (event_name = 'annonce_2_offerts'). Le script relit ces lignes au
 *    demarrage et exclut les pros deja prevenus. Relancable sans risque.
 *  - LE MAIL NE MENT PAS. Le nombre de deblocages offerts restants est lu
 *    en base pour CHAQUE pro (getFreeUnlocksRemaining) : ecrire "2 offerts"
 *    a quelqu'un qui n'en a plus qu'un serait exactement le genre d'erreur
 *    qu'on repare ici.
 *  - ARRET PROPRE SUR QUOTA. Le plan Resend gratuit plafonne a 100 emails
 *    par jour, partages avec la prospection et les mails du site. On s'arrete
 *    a la premiere erreur de quota ; les restants partent au passage suivant.
 *
 * USAGE
 *   npx tsx scripts/annonce-2-offerts.ts             # simulation
 *   npx tsx scripts/annonce-2-offerts.ts --envoyer
 */
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
const resend = new Resend(process.env.RESEND_API_KEY);

const ENVOYER = process.argv.includes("--envoyer");
const BASE = (process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr").replace(/\s+/g, "");
// Comptes de test, a ne jamais inclure dans un envoi reel.
const TEST = [4393, 99999, 1432477];
const FREE_UNLOCK_COUNT = 2;

type Pro = { id: number; name: string; email: string | null; do_not_contact: boolean | null; email_bounced: boolean | null };

function corps(restants: number): { sujet: string; html: string } {
  // Le message s'adapte au compteur reel du pro.

  const sujet = restants >= 2 ? "Vos 2 premiers chantiers sont offerts (on ne vous l'avait pas dit)"
    : restants === 1 ? "Il vous reste un chantier offert sur votre compte"
    : "Ce que vous coûte Workwave, en clair";

  const html = renderEmail({ title: "Votre prochain contact.", subtitle: "À choisir dans votre espace.", category: "Professionnels",
body: emailParagraph(restants > 0 ? `Votre compte dispose de ${restants} déblocage${restants > 1 ? "s" : ""} offert${restants > 1 ? "s" : ""}. Vous pouvez les utiliser pour consulter les coordonnées des projets qui vous intéressent.` : "Vos déblocages offerts ont été utilisés. Vous pouvez continuer à consulter les projets disponibles et choisir les contacts à débloquer.")
 + emailButton("Consulter les projets", `${BASE}/pro/dashboard/leads`)
 + emailParagraph("Votre fiche et la consultation des projets sont gratuites. Hors déblocages offerts disponibles, les coordonnées coûtent 9,90 € TTC par projet. Sans abonnement ni commission sur vos prestations.")
 + emailParagraph("La disponibilité des projets évolue. Consultez les informations avant de choisir de répondre : le déblocage d’un contact ne garantit pas un chantier.")
 + emailParagraph("Une question sur le fonctionnement ? Répondez à cet email.\nWilly, fondateur de Workwave.fr")
 + `<p style="font-size:12px;line-height:1.8;color:#66727c">Vous recevez ce message à la suite du rattachement de votre fiche. Pour suspendre les notifications, <a style="color:#596670" href="${BASE}/pro/dashboard/preferences">mettez votre fiche en pause</a>.</p>` });
  return { sujet, html };
}

(async () => {
  // 1. les pros avec un compte, joignables
  const { data, error } = await sb
    .from("pros")
    .select("id, name, email, do_not_contact, email_bounced")
    .not("claimed_by_user_id", "is", null)
    .eq("is_active", true)
    .is("deleted_at", null);
  if (error) { console.error("ERREUR lecture pros:", error.message); process.exit(1); }
  const candidats = ((data || []) as unknown as Pro[])
    .filter((p) => !TEST.includes(p.id))
    .filter((p) => p.email && !p.do_not_contact && !p.email_bounced);
  console.log(`pros avec compte, joignables : ${candidats.length}`);

  // 2. exclure ceux DEJA prevenus
  const deja = new Set<number>();
  let off = 0;
  for (;;) {
    const { data: e, error: ee } = await sb
      .from("events").select("pro_id").eq("event_name", "annonce_2_offerts").range(off, off + 999);
    if (ee) { console.error("ERREUR events:", ee.message); process.exit(1); }
    const r = e || [];
    if (!r.length) break;
    r.forEach((x: { pro_id: number | null }) => x.pro_id && deja.add(x.pro_id));
    off += r.length;
  }
  console.log(`deja prevenus                : ${deja.size}`);
  const lot = candidats.filter((p) => !deja.has(p.id));
  console.log(`A PREVENIR                   : ${lot.length}\n`);
  if (!lot.length) { console.log("rien a envoyer."); return; }

  // 3. compteur de gratuits RESTANTS, pro par pro
  const restantsDe = new Map<number, number>();
  for (const p of lot) {
    const { count } = await sb.from("lead_unlocks")
      .select("id", { count: "exact", head: true })
      .eq("pro_id", p.id).eq("amount_cents", 0);
    restantsDe.set(p.id, Math.max(0, FREE_UNLOCK_COUNT - (count || 0)));
  }
  const rep = new Map<number, number>();
  lot.forEach((p) => rep.set(restantsDe.get(p.id)!, (rep.get(restantsDe.get(p.id)!) || 0) + 1));
  [...rep.entries()].sort((a, b) => b[0] - a[0])
    .forEach(([r, n]) => console.log(`   ${n} pro(s) avec ${r} déblocage(s) offert(s) restant(s)`));

  if (!ENVOYER) {
    console.log(`\nSIMULATION. Apercu :`);
    lot.slice(0, 3).forEach((p) => {
      const m = corps(restantsDe.get(p.id)!);
      console.log(`   ${String(p.email).padEnd(36)} "${m.sujet}"`);
    });
    console.log(`\nrelancer avec --envoyer.`);
    return;
  }

  let envoyes = 0, echecs = 0;
  for (const p of lot) {
    const m = corps(restantsDe.get(p.id)!);
    try {
      const { data: d, error: er } = await resend.emails.send({
        from: "Workwave <contact@workwave.fr>",
        to: p.email!,
        subject: m.sujet,
        ...emailContent(m.html),
        headers: { "X-Mailin-Track-Click": "0", "X-Mailin-Track-Open": "0" },
      });
      if (er) {
        if (/quota/i.test(er.message)) {
          console.log(`\n   QUOTA RESEND ATTEINT. Arret propre.`);
          console.log(`   ${envoyes} prevenus. Les ${lot.length - envoyes} restants partiront au prochain passage.`);
          break;
        }
        echecs++; console.log(`   ECHEC ${p.email} : ${er.message}`); continue;
      }
      envoyes++;
      console.log(`   ${String(p.email).padEnd(36)} ok (${restantsDe.get(p.id)} offert(s))`);
      const { error: et } = await sb.from("events").insert({
        event_name: "annonce_2_offerts",
        pro_id: p.id,
        metadata: { resend_id: d?.id, email: p.email, restants: restantsDe.get(p.id) },
      } as never);
      if (et) console.log(`      TRACE NON ECRITE (risque de doublon) : ${et.message}`);
    } catch (e) {
      echecs++; console.log(`   EXCEPTION ${p.email} : ${(e as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  console.log(`\nprevenus : ${envoyes}`);
  console.log(`echecs   : ${echecs}`);
})();
