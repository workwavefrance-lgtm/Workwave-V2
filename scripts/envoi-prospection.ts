/**
 * ENVOI DE PROSPECTION AUX PROS, avec test A/B des deux modeles de mail.
 *
 * ------------------------------------------------------------------------
 * CE QUI EST GARANTI
 * ------------------------------------------------------------------------
 * 1. JAMAIS DEUX FOIS LA MEME PERSONNE. Chaque envoi ecrit une ligne dans
 *    `events` (event_name = 'prospect_email'). Le script relit ces lignes au
 *    demarrage et exclut tout pro deja contacte. On peut donc le relancer tous
 *    les jours sans risque de doublon, et sans risque d'oubli : ce qui n'a pas
 *    ete envoye reste eligible.
 * 2. LE MAIL NE MENT PAS. On n'ecrit qu'aux pros ayant un chantier OUVERT de
 *    leur metier a moins de 40 km, depose il y a moins de 15 jours (regle de
 *    Willy : au-dela, le client est froid et le pro se fait rembarrer).
 * 3. DESINSCRIPTION REELLE. Lien avec jeton HMAC global (blacklist definitive),
 *    plus un lien de suppression de fiche. Sans jeton valide, la page affiche
 *    "lien invalide" et le destinataire est piege : c'est ce qui avait declenche
 *    une menace de plainte CNIL en mai 2026.
 * 4. ORIGINE DES DONNEES ANNONCEE. Obligation double : la Licence Ouverte
 *    Etalab impose la paternite, et l'article 14 du RGPD impose d'informer la
 *    personne quand ses donnees ne viennent pas d'elle.
 * 5. AUCUN PISTAGE. Headers X-Mailin-Track a 0 et suivi desactive cote domaine.
 *    Le suivi des clics reecrit les liens et casse les jetons de desinscription
 *    (lecon du 30/04).
 *
 * ------------------------------------------------------------------------
 * USAGE
 *   npx tsx scripts/envoi-prospection.ts                  # simulation
 *   npx tsx scripts/envoi-prospection.ts --nb 3 --test    # 3 vrais mails vers l'admin
 *   npx tsx scripts/envoi-prospection.ts --envoyer --nb 500
 */
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { createHmac } from "crypto";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
const resend = new Resend(process.env.RESEND_API_KEY);

const ENVOYER = process.argv.includes("--envoyer");
const TEST = process.argv.includes("--test");
const MAX_JOURS = 15; // regle de Willy : pas de chantier plus vieux
const EMAIL_TEST = "workwave.france@gmail.com";

/**
 * PLAFOND QUOTIDIEN DE PROSPECTION.
 *
 * Le plan Resend gratuit autorise 100 emails par jour, et ce quota est PARTAGE
 * avec tous les emails du site : codes de verification de reclamation,
 * notifications de nouveau projet, diffusion d'un chantier aux pros abonnes,
 * demandes d'avis, relances. Si la prospection mange les 100, un pro qui
 * reclame sa fiche ne recoit pas son code et le tunnel casse en silence.
 *
 * On plafonne donc a 70 et on laisse 30 au site. Mesure du 12/08 : le premier
 * lot a consomme le quota en quelques minutes, puis 322 tentatives ont ete
 * refusees d'affilee. D'ou l'arret immediat a la premiere erreur de quota.
 */
const MAX_JOUR = 70;
const NB = Number(process.argv[process.argv.indexOf("--nb") + 1]) || MAX_JOUR;
const BASE = (process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr").replace(/\s+/g, "");

// jeton de blacklist definitive, meme algorithme que lib/utils/unsubscribe-token
function jetonGlobal(proId: number): string {
  return createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(`cold-email-global-blacklist:${proId}`)
    .digest("hex");
}

const URGENCE: Record<string, string> = {
  urgent: "au plus vite",
  this_week: "cette semaine",
  this_month: "ce mois-ci",
  flexible: "sans date imposee",
};

type Cible = {
  pro_id: number; nom: string; slug: string; email: string;
  metier: string; ville: string;
  projet_id: number; projet_ville: string; projet_cp: string; projet_metier: string;
  km: number; urgence: string; jours: number;
};

const echappe = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function pied(c: Cible): string {
  const t = jetonGlobal(c.pro_id);
  return `
      Votre fiche figure sur Workwave.fr a partir de donnees publiques : registre
      des entreprises (base Sirene) et liste des entreprises RGE publiee par
      l'ADEME sous Licence Ouverte.
      <a href="${BASE}/unsubscribe-all?token=${t}&amp;id=${c.pro_id}" style="color:#999999;">Se desinscrire</a> &middot;
      <a href="${BASE}/artisan/${c.slug}/supprimer" style="color:#999999;">Supprimer ma fiche</a>`;
}

const lieu = (c: Cible) => (c.km === 0 ? "dans votre commune" : `a ${c.km} km de vous`);
const depuis = (c: Cible) =>
  c.jours === 0 ? "aujourd'hui" : c.jours === 1 ? "hier" : `il y a ${c.jours} jours`;

/** Modele A : structure, le chantier sert de preuve. */
function modeleA(c: Cible) {
  const sujet = `Chantier ${c.projet_metier.toLowerCase()} a ${c.projet_ville} (${c.projet_cp.slice(0, 2)})`;
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F7F7F7;padding:24px;color:#0A0A0A;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #E5E5E5;border-radius:16px;padding:32px;">
    <p style="font-family:'SF Mono',Menlo,monospace;font-size:11px;color:#999999;letter-spacing:0.2em;margin:0 0 20px 0;">[ WORKWAVE &middot; VOTRE FICHE ]</p>
    <h1 style="font-size:24px;color:#0A0A0A;margin:0 0 12px 0;font-weight:800;letter-spacing:-0.02em;line-height:1.25;">Votre entreprise est deja sur Workwave.fr</h1>
    <p style="font-size:14px;color:#525252;line-height:1.65;margin:0 0 20px 0;">
      Bonjour,<br><br>
      <strong style="color:#0A0A0A;">${echappe(c.nom)}</strong> a une fiche publique sur Workwave.fr, creee a partir du registre officiel des entreprises. Vous n'avez rien demande. Vous pouvez la reprendre, la corriger, ou demander sa suppression. Les trois se font en un clic.
    </p>
    <div style="background:#FFF4E8;border:1px solid #FFD9B8;border-radius:8px;padding:12px 16px;margin:0 0 20px 0;">
      <p style="font-size:13px;color:#B24800;margin:0;font-weight:700;">Vos 2 premiers deblocages sont offerts : vos 2 premiers chantiers ne vous coutent rien.</p>
    </div>
    <div style="background:#FAFAFA;border-left:3px solid #FF6803;padding:20px;border-radius:8px;margin:0 0 24px 0;">
      <p style="font-size:11px;color:#999999;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;margin:0 0 10px 0;">Pourquoi je vous ecris</p>
      <h2 style="font-size:17px;color:#0A0A0A;margin:0 0 12px 0;font-weight:700;line-height:1.35;">Un particulier de ${echappe(c.projet_ville)} cherche un ${echappe(c.projet_metier.toLowerCase())}</h2>
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <tr><td style="padding:4px 0;color:#999999;width:96px;">Depose</td><td style="color:#0A0A0A;font-weight:600;">${depuis(c)}</td></tr>
        <tr><td style="padding:4px 0;color:#999999;">Lieu</td><td style="color:#0A0A0A;font-weight:600;">${echappe(c.projet_ville)} (${echappe(c.projet_cp)})</td></tr>
        <tr><td style="padding:4px 0;color:#999999;">Distance</td><td style="color:#0A0A0A;font-weight:600;">${lieu(c)}</td></tr>
        <tr><td style="padding:4px 0;color:#999999;">Delai</td><td style="color:#0A0A0A;font-weight:600;">${URGENCE[c.urgence] || "a definir"}</td></tr>
      </table>
      <p style="font-size:13px;color:#525252;line-height:1.6;margin:14px 0 0 0;">Il est parti aux professionnels qui avaient repris leur fiche. Vous n'en faisiez pas partie.</p>
    </div>
    <p style="font-size:11px;color:#999999;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;margin:0 0 10px 0;">Comment ca marche</p>
    <table style="width:100%;font-size:14px;border-collapse:collapse;margin:0 0 24px 0;">
      <tr><td style="padding:7px 12px 7px 0;color:#FF6803;font-weight:800;vertical-align:top;width:20px;">1</td><td style="padding:7px 0;color:#525252;line-height:1.6;">Un chantier pour votre domaine d'activite arrive dans votre secteur, vous recevez le descriptif par email. <strong style="color:#0A0A0A;">Gratuit.</strong></td></tr>
      <tr><td style="padding:7px 12px 7px 0;color:#FF6803;font-weight:800;vertical-align:top;">2</td><td style="padding:7px 0;color:#525252;line-height:1.6;">Le chantier vous interesse, vous debloquez le nom, le telephone et l'email du particulier pour <strong style="color:#0A0A0A;">9,90 &euro;</strong>. <strong style="color:#FF6803;">Vos 2 premiers deblocages sont offerts.</strong></td></tr>
      <tr><td style="padding:7px 12px 7px 0;color:#FF6803;font-weight:800;vertical-align:top;">3</td><td style="padding:7px 0;color:#525252;line-height:1.6;">Vous l'appelez directement. <strong style="color:#0A0A0A;">Aucun abonnement, aucune commission</strong> sur ce que vous facturez.</td></tr>
    </table>
    <a href="${BASE}/pro/reclamer/${c.slug}" style="display:inline-block;background:#FF6803;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Reprendre ma fiche</a>
    <p style="font-size:13px;color:#525252;line-height:1.6;margin:18px 0 0 0;">Vous pouvez d'abord regarder ce qui est publie sur vous : <a href="${BASE}/artisan/${c.slug}" style="color:#FF6803;font-weight:600;text-decoration:none;">voir ma fiche</a>.</p>
    <hr style="border:none;border-top:1px solid #E5E5E5;margin:28px 0 20px 0;">
    <p style="font-size:13px;color:#525252;line-height:1.6;margin:0;">Willy Gauvrit<br><span style="color:#999999;">Fondateur de Workwave.fr, ancien artisan</span></p>
    <p style="font-size:11px;color:#999999;line-height:1.6;margin:22px 0 0 0;">${pied(c)}</p>
  </div>
</div>`;
  return { sujet, html };
}

/** Modele B : lettre personnelle, sans mise en page marketing. */
function modeleB(c: Cible) {
  const sujet = `Un chantier de ${c.projet_metier.toLowerCase()} a ${c.projet_ville}`;
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#ffffff;padding:32px 28px;color:#0A0A0A;">
  <div style="max-width:560px;margin:0 auto;font-size:15px;line-height:1.75;color:#1A1A1A;">
    <p style="margin:0 0 18px 0;">Bonjour,</p>
    <p style="margin:0 0 18px 0;">Je m'appelle Willy Gauvrit, j'ai monte Workwave.fr. J'ai ete artisan avant, donc je vais aller droit au but.</p>
    <p style="margin:0 0 18px 0;">Votre entreprise, <strong>${echappe(c.nom)}</strong>, apparait sur mon site avec une fiche construite a partir du registre officiel. Vous ne m'avez rien demande. Si elle vous derange, le lien en bas la supprime, sans discussion.</p>
    <p style="margin:0 0 18px 0;">Si je vous ecris aujourd'hui, c'est qu'<strong>un particulier de ${echappe(c.projet_ville)} a depose une demande de ${echappe(c.projet_metier.toLowerCase())} ${depuis(c)}</strong>, ${URGENCE[c.urgence] || "sans date imposee"}, ${lieu(c)}. Elle est partie aux professionnels qui avaient repris leur fiche chez moi. Vous n'en faisiez pas partie, et ca me gene, parce que vous etes juste a cote.</p>
    <p style="margin:0 0 18px 0;">Le fonctionnement tient en trois lignes. Vous recevez par email le descriptif de tout chantier pour votre domaine d'activite, gratuitement. Si le client vous interesse, vous payez 9,90 &euro; une fois pour avoir son nom, son telephone et son email, et vos 2 premiers deblocages sont offerts. Vous l'appelez, et ce que vous facturez ensuite ne me regarde pas : pas d'abonnement, pas de commission.</p>
    <p style="margin:0 0 18px 0;">Reprendre votre fiche prend deux minutes, avec votre SIRET :<br><a href="${BASE}/pro/reclamer/${c.slug}" style="color:#FF6803;font-weight:700;text-decoration:none;">workwave.fr/pro/reclamer</a></p>
    <p style="margin:0 0 18px 0;">Et si vous voulez juste voir ce qui est ecrit sur vous :<br><a href="${BASE}/artisan/${c.slug}" style="color:#525252;text-decoration:underline;">votre fiche publique</a></p>
    <p style="margin:0 0 6px 0;">Bien a vous,</p>
    <p style="margin:0 0 28px 0;">Willy</p>
    <p style="font-size:12px;color:#999999;line-height:1.6;margin:0;border-top:1px solid #E5E5E5;padding-top:16px;">${pied(c)}</p>
  </div>
</div>`;
  return { sujet, html };
}

const hav = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * r, dLon = (b.longitude - a.longitude) * r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * r) * Math.cos(b.latitude * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
const EMAIL_OK = /^[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}$/i;

/**
 * Calcule les destinataires DEPUIS LA BASE, sans aucun fichier local.
 *
 * Le 13/08, le script dependait d'un JSON dans /tmp : le redemarrage du Mac a
 * vide /tmp et le passage quotidien a plante. Un envoi automatique ne doit
 * dependre de rien d'autre que de la base.
 */
async function calculerCibles(): Promise<Cible[]> {
  const limite = new Date(Date.now() - MAX_JOURS * 86400e3).toISOString();
  const { data: pj, error } = await sb
    .from("projects")
    .select("id, category_id, urgency, created_at, categories(name), cities(name, postal_code, latitude, longitude)")
    .eq("vertical", "btp")
    .not("status", "in", "(closed,deleted)")
    .gte("created_at", limite);
  if (error) { console.error("ERREUR projets:", error.message); process.exit(1); }
  const projets = (pj || []) as unknown as {
    id: number; category_id: number; urgency: string; created_at: string;
    categories: { name: string } | null;
    cities: { name: string; postal_code: string; latitude: number; longitude: number } | null;
  }[];

  const cibles: Cible[] = [];
  const compteurEmail = new Map<string, number>();
  const vus = new Set<number>();

  for (const p of projets) {
    const cv = p.cities;
    if (!cv?.latitude) continue;
    const { data: c } = await sb
      .from("pros")
      .select("id, name, slug, email, cities!inner(name, latitude, longitude), categories(name)")
      .eq("category_id", p.category_id)
      .eq("is_active", true).is("deleted_at", null)
      .is("claimed_by_user_id", null)
      .neq("do_not_contact", true).neq("email_bounced", true)
      .not("email", "is", null)
      .gte("cities.latitude", cv.latitude - 0.5).lte("cities.latitude", cv.latitude + 0.5)
      .gte("cities.longitude", cv.longitude - 0.7).lte("cities.longitude", cv.longitude + 0.7)
      .limit(1000);
    for (const x of (c || []) as unknown as {
      id: number; name: string; slug: string; email: string;
      cities: { name: string; latitude: number; longitude: number };
      categories: { name: string } | null;
    }[]) {
      const mail = (x.email || "").trim().toLowerCase();
      if (!mail || !EMAIL_OK.test(mail)) continue;
      compteurEmail.set(mail, (compteurEmail.get(mail) || 0) + 1);
      if (vus.has(x.id)) continue;
      const d = hav(cv, x.cities);
      if (d > 40) continue;
      vus.add(x.id);
      cibles.push({
        pro_id: x.id, nom: x.name, slug: x.slug, email: mail,
        metier: x.categories?.name || "", ville: x.cities.name,
        projet_id: p.id, projet_ville: cv.name, projet_cp: cv.postal_code,
        projet_metier: p.categories?.name || "", km: Math.round(d), urgence: p.urgency,
        jours: Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400e3),
      });
    }
  }
  // adresses partagees par plusieurs entreprises : jamais de mail nominatif
  const mutualisees = new Set([...compteurEmail.entries()].filter(([, n]) => n > 1).map(([e]) => e));
  return cibles.filter((c) => !mutualisees.has(c.email));
}

(async () => {
  const fraiches = await calculerCibles();
  console.log(`chantiers <= ${MAX_JOURS} j, pros joignables a <= 40 km : ${fraiches.length}`);

  // 2. exclure les pros DEJA contactes (pagination : la table events grossit)
  const deja = new Set<number>();
  let off = 0;
  for (;;) {
    const { data, error } = await sb
      .from("events").select("pro_id")
      .eq("event_name", "prospect_email")
      .range(off, off + 999);
    if (error) { console.error("ERREUR events:", error.message); process.exit(1); }
    const r = data || [];
    if (!r.length) break;
    r.forEach((e: { pro_id: number | null }) => e.pro_id && deja.add(e.pro_id));
    off += r.length;
  }
  console.log(`deja contactes  : ${deja.size}`);

  const restants = fraiches.filter((c) => !deja.has(c.pro_id));
  // les chantiers les plus frais d'abord
  restants.sort((a, b) => a.jours - b.jours || a.km - b.km);

  // combien de prospection est deja partie AUJOURD'HUI (le script peut etre
  // relance a la main apres le passage automatique)
  const debutJour = new Date(); debutJour.setHours(0, 0, 0, 0);
  const { count: dejaAujourdhui } = await sb
    .from("events").select("id", { count: "exact", head: true })
    .eq("event_name", "prospect_email").gte("created_at", debutJour.toISOString());
  const restantJour = Math.max(0, MAX_JOUR - (dejaAujourdhui || 0));
  console.log(`deja envoyes aujourd'hui : ${dejaAujourdhui || 0} / ${MAX_JOUR}`);
  if (restantJour === 0 && !TEST) {
    console.log(`plafond du jour atteint. Rien n'est envoye, rien n'est perdu.`);
    return;
  }

  const lot = restants.slice(0, Math.min(NB, TEST ? NB : restantJour));
  console.log(`A ENVOYER MAINTENANT : ${lot.length} (reste ${restants.length - lot.length} pour les jours suivants)`);

  if (!lot.length) { console.log("\nrien a envoyer."); return; }

  // 3. repartition A/B equilibree PAR CHANTIER (sinon un modele herite d'un
  //    seul metier et l'ecart mesure refleterait le metier, pas le modele)
  const parProjet = new Map<number, Cible[]>();
  lot.forEach((c) => parProjet.set(c.projet_id, [...(parProjet.get(c.projet_id) || []), c]));
  const variante = new Map<number, "A" | "B">();
  for (const [, g] of parProjet) {
    g.sort((a, b) => a.pro_id - b.pro_id);
    g.forEach((c, i) => variante.set(c.pro_id, i % 2 === 0 ? "A" : "B"));
  }
  const nA = lot.filter((c) => variante.get(c.pro_id) === "A").length;
  console.log(`  modele A : ${nA}   modele B : ${lot.length - nA}`);

  if (!ENVOYER && !TEST) {
    console.log(`\nSIMULATION. Apercu des 3 premiers :`);
    lot.slice(0, 3).forEach((c) => {
      const v = variante.get(c.pro_id)!;
      const m = v === "A" ? modeleA(c) : modeleB(c);
      console.log(`   [${v}] ${c.email.padEnd(34)} "${m.sujet}"`);
    });
    console.log(`\nrelancer avec --envoyer pour envoyer reellement.`);
    return;
  }

  // 4. envoi
  let envoyes = 0, echecs = 0;
  for (const c of lot) {
    const v = variante.get(c.pro_id)!;
    const m = v === "A" ? modeleA(c) : modeleB(c);
    const destinataire = TEST ? EMAIL_TEST : c.email;
    try {
      const { data, error } = await resend.emails.send({
        from: "Workwave <contact@workwave.fr>",
        to: destinataire,
        subject: m.sujet,
        html: m.html,
        headers: {
          "X-Mailin-Track-Click": "0",
          "X-Mailin-Track-Open": "0",
          "List-Unsubscribe": `<${BASE}/unsubscribe-all?token=${jetonGlobal(c.pro_id)}&id=${c.pro_id}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
      if (error) {
        // Quota atteint : on ARRETE net. Le 12/08, sans cet arret, 322
        // tentatives sont parties dans le vide a la suite. Les pros concernes
        // n'etant pas traces, ils repartiront au prochain passage.
        if (/quota/i.test(error.message)) {
          console.log(`\n   QUOTA RESEND ATTEINT. Arret propre.`);
          console.log(`   ${envoyes} envoyes avant l'arret. Les autres restent eligibles pour demain.`);
          break;
        }
        echecs++;
        console.log(`   ECHEC ${c.email} : ${error.message}`);
        continue;
      }
      envoyes++;
      console.log(`   [${v}] ${c.email.padEnd(34)} ok`);
      // trace : c'est ELLE qui garantit qu'on ne renverra jamais deux fois
      if (!TEST) {
        const { error: ee } = await sb.from("events").insert({
          event_name: "prospect_email",
          pro_id: c.pro_id,
          project_id: c.projet_id,
          metadata: { variante: v, resend_id: data?.id, email: c.email, jours: c.jours, km: c.km },
        } as never);
        if (ee) console.log(`      TRACE NON ECRITE (risque de doublon) : ${ee.message}`);
      }
    } catch (e) {
      echecs++;
      console.log(`   EXCEPTION ${c.email} : ${(e as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 600)); // ~1,6 mail/s
  }

  console.log(`\nenvoyes : ${envoyes}`);
  console.log(`echecs  : ${echecs}`);
  if (!TEST) console.log(`reste pour demain : ${restants.length - lot.length}`);
})();
