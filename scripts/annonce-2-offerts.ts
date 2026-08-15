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

const echappe = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function corps(restants: number): { sujet: string; html: string } {
  // Le message s'adapte au compteur reel du pro.
  const titre = restants >= 2 ? "Vos 2 premiers chantiers sont offerts"
    : restants === 1 ? "Il vous reste un chantier offert"
    : "Une mise au point sur ce que vous coûte Workwave";
  const sujet = restants >= 2 ? "Vos 2 premiers chantiers sont offerts (on ne vous l'avait pas dit)"
    : restants === 1 ? "Il vous reste un chantier offert sur votre compte"
    : "Ce que vous coûte Workwave, en clair";

  const encadre = restants > 0
    ? `<div style="background:#FFF4E8;border:1px solid #FFD9B8;border-radius:10px;padding:18px 20px;margin:0 0 24px 0;">
      <p style="font-size:16px;color:#B24800;margin:0 0 6px 0;font-weight:800;">${restants === 1 ? "1 déblocage offert" : "2 déblocages offerts"}, sur votre compte, maintenant</p>
      <p style="font-size:14px;color:#8A3A00;margin:0;line-height:1.6;">
        Aucun code, aucune carte bancaire, rien à activer. Vous ouvrez un chantier
        qui vous intéresse, vous obtenez le nom, le téléphone et l'email du client.
        Le prix s'applique ensuite.
      </p>
    </div>`
    : `<div style="background:#FAFAFA;border:1px solid #E5E5E5;border-radius:10px;padding:18px 20px;margin:0 0 24px 0;">
      <p style="font-size:14px;color:#525252;margin:0;line-height:1.6;">
        Vous avez déjà utilisé vos deux déblocages offerts. Les suivants sont à
        9,90 € l'unité, sans abonnement ni commission.
      </p>
    </div>`;

  const intro = restants > 0
    ? `<p style="font-size:15px;color:#525252;line-height:1.7;margin:0 0 18px 0;">
      Je vous écris parce qu'on a fait une erreur, et qu'elle vous a peut-être coûté un chantier.
    </p>
    <p style="font-size:15px;color:#525252;line-height:1.7;margin:0 0 22px 0;">
      Quand un chantier de votre secteur vous est envoyé, notre email indique qu'il faut
      <strong style="color:#0A0A0A;">9,90&nbsp;€</strong> pour obtenir les coordonnées du client.
      Il ne dit pas que <strong style="color:#0A0A0A;">vos premiers déblocages ne vous coûtent rien</strong>.
      C'était le cas depuis le début, on ne l'avait simplement écrit nulle part.
    </p>`
    : `<p style="font-size:15px;color:#525252;line-height:1.7;margin:0 0 22px 0;">
      Notre email de chantier annonce le prix de 9,90 € sans préciser le reste.
      Voici donc, en clair, ce que Workwave vous coûte et ce qu'il ne vous coûte pas.
    </p>`;

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F7F7F7;padding:24px;color:#0A0A0A;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #E5E5E5;border-radius:16px;padding:32px;">
    <p style="font-family:'SF Mono',Menlo,monospace;font-size:11px;color:#999999;letter-spacing:0.2em;margin:0 0 20px 0;">[ WORKWAVE &middot; VOTRE COMPTE ]</p>
    <h1 style="font-size:24px;color:#0A0A0A;margin:0 0 16px 0;font-weight:800;letter-spacing:-0.02em;line-height:1.25;">${titre}</h1>
    <p style="font-size:15px;color:#525252;line-height:1.7;margin:0 0 18px 0;">Bonjour,</p>
    ${intro}
    ${encadre}
    <p style="font-size:11px;color:#999999;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;margin:0 0 10px 0;">Ce que vous payez, en clair</p>
    <table style="width:100%;font-size:14px;border-collapse:collapse;margin:0 0 26px 0;">
      <tr><td style="padding:6px 0;color:#525252;">Recevoir les chantiers de votre zone</td><td style="padding:6px 0;color:#0A0A0A;font-weight:700;text-align:right;">0 &euro;</td></tr>
      <tr><td style="padding:6px 0;color:#525252;">Vos ${FREE_UNLOCK_COUNT} premiers déblocages</td><td style="padding:6px 0;color:#0A0A0A;font-weight:700;text-align:right;">0 &euro;</td></tr>
      <tr><td style="padding:6px 0;color:#525252;">Les suivants, par chantier</td><td style="padding:6px 0;color:#0A0A0A;font-weight:700;text-align:right;">9,90 &euro;</td></tr>
      <tr><td style="padding:6px 0;color:#525252;">Abonnement</td><td style="padding:6px 0;color:#0A0A0A;font-weight:700;text-align:right;">aucun</td></tr>
      <tr><td style="padding:6px 0;color:#525252;">Commission sur vos travaux</td><td style="padding:6px 0;color:#0A0A0A;font-weight:700;text-align:right;">aucune</td></tr>
    </table>
    <a href="${BASE}/pro/dashboard/leads" style="display:inline-block;background:#FF6803;color:#ffffff;padding:15px 30px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Voir les chantiers de ma zone</a>
    <p style="font-size:13px;color:#525252;line-height:1.6;margin:20px 0 0 0;">
      Les chantiers déjà reçus vous attendent toujours dans votre espace. Rien ne se perd.
    </p>
    <hr style="border:none;border-top:1px solid #E5E5E5;margin:28px 0 20px 0;">
    <p style="font-size:14px;color:#525252;line-height:1.6;margin:0;">
      Willy Gauvrit<br><span style="color:#999999;">Fondateur de Workwave.fr, ancien artisan</span>
    </p>
    <p style="font-size:12px;color:#999999;line-height:1.6;margin:20px 0 0 0;">
      Vous recevez ce message parce que vous avez repris votre fiche sur Workwave.fr.
      Pour ne plus recevoir de chantiers, mettez votre compte en pause depuis votre
      <a href="${BASE}/pro/dashboard/preferences" style="color:#999999;">espace professionnel</a>.
    </p>
  </div>
</div>`;
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
        html: m.html,
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
