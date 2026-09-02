/**
 * Broadcast email a TOUS les pros BTP de la categorie + zone du projet.
 * Phase Sprint 13 (2026-05-27) : nouveau modele pay-per-lead.
 * Phase Sprint 14 (2026-06-06) : matching par distance Haversine (rayon
 * d'intervention du pro), au lieu du filtre "meme departement" qui ratait
 * les leads cross-departementaux.
 *
 * Difference avec broadcastTechProject :
 *   - BTP : filtre par categorie EXACTE du projet + distance(pro, projet) <= rayon pro
 *     (le pro n'a pas besoin d'etre Premium pour recevoir, mais doit payer 9,90€
 *      par lead unlock pour voir les coordonnees)
 *   - Tech : broadcast a tous les freelances dans les 14 categories AI (modele
 *     Codeur.com generaliste)
 *
 * Filtres durs (cote SELECT pros) :
 *   - category_id du pro dans le CLUSTER de la categorie projet (genie climatique :
 *     plombier+chauffagiste+climaticien matches ensemble) OU une de ces categories
 *     dans secondary_category_ids du pro. Hors cluster : categorie exacte du projet.
 *   - pro.city dans une bounding box ~200km autour du projet (pre-filtre SQL rapide)
 *   - distance(pro.city.lat/lng <-> projet.city.lat/lng) <= pro.intervention_radius_km
 *     (filtre exact Haversine cote JS apres SELECT)
 *   - is_active = true, deleted_at IS NULL
 *   - claimed_by_user_id IS NOT NULL (fiche revendiquee, donc auto-subscribed)
 *   - email IS NOT NULL
 *   - paused_until IS NULL OR paused_until < NOW()
 *   - do_not_contact = false
 *   - source IN ('sirene', 'pagesjaunes', 'manual', 'ai_signup')
 *
 * Fallback si projet sans lat/lng (ville sans coordonnees en base) :
 *   filtre "meme departement" (comportement legacy avant 2026-06-06).
 *
 * NB : on ne filtre PAS par subscription_status. Tous les pros BTP claimed
 * recoivent les mails. La paywall est sur l'unlock (9,90€ par lead).
 *
 * Volume estime : sur les ~1M pros BTP, ~14 claimed aujourd'hui. Au volume
 * cible (~1000+ claimed), la bounding box pre-filtre SQL evite de fetcher
 * des dizaines de milliers de pros pour rien.
 */
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { haversineKm } from "@/lib/utils/haversine";
import { getGeneralistCategoryIds } from "@/lib/matching/generalist";
import { getServiceClient } from "@/lib/supabase/service-client";

let _resend: Resend | null = null;
function getResendClient(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}


/**
 * Clusters de metiers "reellement le meme artisan" → un lead dans l'un doit
 * toucher les pros des autres. Les pages SEO restent SEPAREES (recherches
 * distinctes) ; c'est uniquement le MATCHING du broadcast qui est elargi.
 * Decision Willy 23/06/2026 :
 *   - genie climatique (CVC) : plombier + chauffagiste + climaticien (meme
 *     artisan ; "climaticien" comme metier autonome n'existe quasiment pas).
 * Resolu slug → id au runtime (JAMAIS d'id en dur, lecon CATEGORY_ID_MAP 26/05).
 */
const MATCHING_CLUSTERS: string[][] = [
  ["plombier", "chauffagiste", "climaticien"],
];

/**
 * Si la categorie du projet appartient a un cluster, retourne TOUS les ids du
 * cluster (le lead touchera les metiers lies). Sinon, juste la categorie projet.
 */
export async function getMatchCategoryIds(
  sb: ReturnType<typeof getServiceClient>,
  projectCategoryId: number
): Promise<number[]> {
  const slugs = [...new Set(MATCHING_CLUSTERS.flat())];
  const { data } = await sb.from("categories").select("id, slug").in("slug", slugs);
  const idBySlug = new Map(
    ((data || []) as { id: number; slug: string }[]).map((c) => [c.slug, c.id])
  );
  for (const cluster of MATCHING_CLUSTERS) {
    const ids = cluster
      .map((s) => idBySlug.get(s))
      .filter((x): x is number => x != null);
    if (ids.includes(projectCategoryId)) return ids;
  }
  return [projectCategoryId];
}

/**
 * Marque le projet comme traité.
 *   - broadcast normal : broadcast_count + broadcasted_at
 *   - relance J+3      : relance_sent_at (sans écraser le compteur d'origine)
 * Une seule écriture, idempotente : en relance, relance_sent_at non-null = ne
 * sera plus jamais re-sélectionné par le cron de relance.
 */
async function markProjectDone(
  sb: ReturnType<typeof getServiceClient>,
  projectId: number,
  relanceKind: "j1" | "j3" | null,
  sentCount: number
): Promise<void> {
  // ── DIFFUSION INITIALE SANS AUCUN ENVOI : ON NE MARQUE PAS ────────────────
  // Ecrire broadcasted_at alors que zero pro a ete touche condamnait le projet :
  //   - broadcast-rescue selectionne `broadcasted_at IS NULL`  -> plus rattrape
  //   - relance-projets  selectionne `broadcast_count > 0`     -> plus relance
  // Le projet sortait des DEUX filets et devenait invisible a vie.
  //
  // Mesure du 07/08/2026 : 53 projets BTP sur 108 dans cet etat. La cause n'est
  // pas un echec d'envoi mais l'absence de pro eligible (36 pros ont reclame
  // leur fiche en tout), sauf que c'est justement le cas qu'il faut garder
  // ouvert : le jour ou un pro de la zone reclame sa fiche, le projet doit
  // repartir. 7 des projets bloques auraient un preneur aujourd'hui.
  // Meme raisonnement si Resend tombe (deja vu 12 jours en mai 2026) : le lead
  // doit rester rattrapable, pas etre classe.
  //
  // Aucun risque d'envoi perime : broadcast-rescue ne regarde que les projets
  // de moins de 14 jours (`created_at >= NOW() - 14 days`). Passe ce delai le
  // projet cesse d'etre repropose, il reste simplement non marque.
  //
  // Les RELANCES (j1/j3) continuent d'ecrire leur colonne quoi qu'il arrive :
  // sans ca, le cron de relance les rejouerait en boucle a chaque passage.
  if (relanceKind === null && sentCount === 0) return;

  // Chaque relance ecrit dans SA colonne : sinon la relance J+1 remplirait
  // relance_sent_at et empecherait definitivement la relance J+3 de partir.
  const update =
    relanceKind === "j1"
      ? { relance_j1_sent_at: new Date().toISOString() }
      : relanceKind === "j3"
        ? { relance_sent_at: new Date().toISOString() }
        : { broadcast_count: sentCount, broadcasted_at: new Date().toISOString() };
  await sb.from("projects").update(update).eq("id", projectId);
}

const CHUNK_SIZE = 50;
const CHUNK_DELAY_MS = 1000;
const UNLOCK_PRICE_EUR_TTC = "9,90";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type BroadcastBtpInput = {
  projectId: number;
  projectTitle: string;
  projectDescription: string;
  projectBudget: string | null;
  projectTimeline: string | null;
  projectCategoryName: string;
  projectCategoryId: number;
  projectCityName: string | null;
  /** Id de la ville du projet, utilise pour fetcher lat/lng et calculer la distance vs rayon des pros. */
  projectCityId: number | null;
  /** Fallback si la ville du projet n'a pas de lat/lng (filtre "meme departement"). */
  projectDepartmentId: number;
  isSuspicious: boolean;
  /** Mode relance J+3 : texte d'email plus doux + marque relance_sent_at au lieu de broadcasted_at (ne touche pas au compteur d'origine). */
  isRelance?: boolean;
  /**
   * Type de relance. Chaque relance a SA propre colonne d'idempotence, sinon la
   * 1re bloquerait la 2e :
   *   "j1" -> relance_j1_sent_at : 24 h apres, "un projet vous attend"
   *   "j3" -> relance_sent_at    : 3 jours apres, "toujours disponible"
   * Non fourni + isRelance=true => "j3" (comportement historique preserve).
   */
  relanceKind?: "j1" | "j3";
};

export type BroadcastBtpResult = {
  totalTargets: number;
  sent: number;
  failed: number;
  errors: string[];
};

/**
 * Mappe les enums du form deposer-projet vers des libelles humains FR.
 * Si la valeur est inconnue, on la renvoie telle quelle (defensive, evite
 * de cacher l'info en cas de nouveau enum non encore mappe).
 */
function humanBudget(value: string | null): string | null {
  if (!value) return null;
  const m: Record<string, string> = {
    lt500: "Moins de 500 €",
    "500_2000": "500 à 2 000 €",
    "2000_5000": "2 000 à 5 000 €",
    "5000_15000": "5 000 à 15 000 €",
    gt15000: "Plus de 15 000 €",
  };
  // 28/08/2026 : la question du budget a ete retiree du formulaire (71 % de
  // reponses inexploitables sur 132 projets). Les nouveaux projets arrivent
  // donc avec « unknown », et la ligne Budget ne doit plus s'afficher du tout :
  // « Non précisé » n'apporte rien a l'artisan qui decide de payer 9,90 €.
  // Les anciens projets gardent leur valeur et restent affiches normalement.
  return m[value] ?? null;
}

/**
 * Echappe le HTML avant insertion dans le corps du mail.
 *
 * 31/08/2026 : le titre et la description, ecrits librement par le
 * particulier, etaient injectes bruts dans le HTML (les deux `${}` du bloc
 * projet plus bas). N'importe qui pouvait donc glisser une balise, et donc un
 * lien pirate, dans un mail signe workwave.fr et envoye aux artisans inscrits.
 * C'est le pire vecteur possible : le mail est authentique, il vient de nous,
 * et les artisans inscrits sont les ~52 pros qui ont reclame leur fiche, la
 * ressource la plus rare du site.
 *
 * Le filtre anti-coordonnees (`lib/ai/detect-pii.ts`) ne remplace PAS cet
 * echappement : il vise les tel/mail/liens, pas les balises, et il ne tourne
 * que sur la description, jamais sur le titre.
 *
 * Meme implementation que `lib/email/send-review-thanks.ts` (fonction locale
 * dupliquee dans chaque fichier d'email, convention deja en place dans
 * send-review-request.ts et send-review-moderation-alert.ts).
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function humanUrgency(value: string | null): string | null {
  if (!value) return null;
  const m: Record<string, string> = {
    today: "Aujourd'hui (urgent)",
    this_week: "Cette semaine",
    this_month: "Ce mois-ci",
    not_urgent: "Pas urgent",
  };
  return m[value] ?? value;
}

/** Exporte pour permettre de PREVISUALISER un email sans l'envoyer (scripts/_preview-mail.ts). */
/**
 * @param freeRemaining Deblocages OFFERTS restants pour ce destinataire.
 *   Quand il est fourni, le mail annonce la gratuite avec le VRAI compteur du
 *   pro. Laisse a `undefined`, le mail n'en parle pas du tout : c'etait le
 *   comportement jusqu'au 15/08/2026, et c'etait un defaut. Le mail annoncait
 *   9,90 EUR sans jamais dire que les deux premiers sont offerts. Mesure du
 *   15/08 : sur 42 pros ayant un compte, 37 n'avaient jamais rien debloque.
 *   Ils voyaient un cout, jamais la gratuite.
 */
export function buildEmailHtml(input: BroadcastBtpInput, baseUrl: string, postalCode?: string | null, freeRemaining?: number): string {
  // On tronque le texte BRUT puis on echappe : dans l'autre sens, la coupe a
  // 220 pourrait tomber au milieu d'une entite (`&amp;`) et produire du HTML
  // casse a l'ecran.
  const previewDescRaw =
    input.projectDescription.length > 220
      ? input.projectDescription.slice(0, 220).trim() + "..."
      : input.projectDescription;
  const previewDesc = escapeHtml(previewDescRaw);
  // Titre : ecrit par le particulier lui aussi (les appelants prennent la 1re
  // ligne de sa description, cf. deposer-projet/actions.ts).
  const projectTitleHtml = escapeHtml(input.projectTitle);
  const budgetLabel = humanBudget(input.projectBudget);
  const timelineLabel = humanUrgency(input.projectTimeline);
  const lieuLabel = input.projectCityName
    ? `${input.projectCityName}${postalCode ? ` (${postalCode})` : ""}`
    : postalCode || null;

  // 3 variantes de texte, même mise en page :
  //   J0  -> annonce du projet
  //   J+1 -> rappel à chaud (le particulier attend encore une réponse)
  //   J+3 -> rappel doux (le projet est toujours sans preneur)
  const isRelance = input.isRelance === true || input.relanceKind != null;
  const kind: "j1" | "j3" | null = input.relanceKind ?? (isRelance ? "j3" : null);
  const lieu = input.projectCityName ? ` à ${input.projectCityName}` : "";

  const tagLabel =
    kind === "j1" ? "PROJET EN ATTENTE" : kind === "j3" ? "RAPPEL PROJET" : "NOUVEAU PROJET";

  const headline =
    kind === "j1"
      ? `Un projet ${input.projectCategoryName}${lieu} vous attend`
      : kind === "j3"
        ? `Toujours disponible : projet ${input.projectCategoryName}${lieu}`
        : `Nouveau projet ${input.projectCategoryName}${lieu}`;

  const introText =
    kind === "j1"
      ? "Personne n'a encore pris ce projet et le particulier attend toujours ses devis. Vous êtes donc encore parmi les premiers à pouvoir vous positionner. Tout est dans votre tableau de bord."
      : kind === "j3"
        ? "Ce projet est toujours en ligne et cherche un professionnel. Si vous souhaitez le traiter, c'est encore le moment. Tout est dans votre dashboard."
        : "Un particulier de votre zone vient de publier une demande qui correspond à votre savoir-faire. Connectez-vous à votre dashboard pour la consulter.";

  const suspiciousBanner = input.isSuspicious
    ? `<div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;padding:12px 16px;margin:0 0 16px 0;">
        <p style="font-size:12px;color:#92400E;margin:0;font-weight:600;">
          &#9888; Projet flague par notre IA : verifiez avant de debloquer.
        </p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F7F7F7;margin:0;padding:24px;color:#0A0A0A;">
  <div style="max-width:600px;margin:0 auto;background:white;border:1px solid #E5E5E5;border-radius:16px;padding:32px;">
    <p style="font-family:'SF Mono',Menlo,monospace;font-size:11px;color:#999;letter-spacing:0.2em;margin:0 0 20px 0;">[ WORKWAVE &middot; ${tagLabel} ]</p>

    <h1 style="font-size:24px;color:#0A0A0A;margin:0 0 8px 0;font-weight:800;letter-spacing:-0.02em;">${headline}</h1>
    <p style="font-size:14px;color:#525252;line-height:1.6;margin:0 0 24px 0;">
      ${introText}
    </p>

    ${suspiciousBanner}

    <div style="background:#FAFAFA;border-left:3px solid #FF6803;padding:20px;border-radius:8px;margin:0 0 24px 0;">
      <h2 style="font-size:18px;color:#0A0A0A;margin:0 0 12px 0;font-weight:700;">${projectTitleHtml}</h2>
      <p style="font-size:13px;color:#525252;line-height:1.6;margin:0 0 16px 0;white-space:pre-wrap;">${previewDesc}</p>
      <table style="font-size:12px;width:100%;border-collapse:collapse;">
        ${lieuLabel ? `<tr><td style="padding:4px 0;color:#999;width:90px;">Lieu</td><td style="color:#0A0A0A;font-weight:600;">${lieuLabel}</td></tr>` : ""}
        ${budgetLabel ? `<tr><td style="padding:4px 0;color:#999;width:90px;">Budget</td><td style="color:#0A0A0A;font-weight:600;">${budgetLabel}</td></tr>` : ""}
        ${timelineLabel ? `<tr><td style="padding:4px 0;color:#999;">D&eacute;lai</td><td style="color:#0A0A0A;font-weight:600;">${timelineLabel}</td></tr>` : ""}
      </table>
    </div>

    ${
      freeRemaining && freeRemaining > 0
        ? `<div style="background:#FFF4E8;border:1px solid #FFD9B8;border-radius:8px;padding:12px 16px;margin:0 0 16px 0;">
        <p style="font-size:13px;color:#B24800;margin:0;font-weight:700;">
          ${freeRemaining === 1 ? "Il vous reste 1 d&eacute;blocage offert" : `Vos ${freeRemaining} premiers d&eacute;blocages sont offerts`} : ce projet ne vous co&ucirc;te rien.
        </p>
      </div>`
        : ""
    }
    <a href="${baseUrl}/pro/dashboard/leads" style="display:inline-block;background:#FF6803;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:0 0 12px 0;">
      ${freeRemaining && freeRemaining > 0 ? "Voir le projet (offert) &rarr;" : "Voir le projet &rarr;"}
    </a>
    <p style="font-size:12px;color:#525252;line-height:1.6;margin:0 0 24px 0;">
      Pas le temps maintenant&nbsp;? Vous retrouverez ce projet &agrave; tout moment dans votre <a href="${baseUrl}/pro/dashboard/leads" style="color:#FF6803;font-weight:600;text-decoration:none;">dashboard, onglet &laquo;&nbsp;Leads&nbsp;&raquo;</a>&nbsp;&mdash; rien ne se perd.
    </p>

    <p style="font-size:12px;color:#525252;line-height:1.6;margin:24px 0 0 0;">
      <strong>Comment ca marche ?</strong> Acces gratuit a tous les projets de votre zone. Pour debloquer les coordonnees d'un particulier (telephone + email) et le contacter directement : ${UNLOCK_PRICE_EUR_TTC}&euro; TTC par projet, <strong>et vos 2 premiers deblocages sont offerts</strong>. Sans engagement, sans abonnement, sans commission.
    </p>
    <p style="font-size:12px;color:#999;line-height:1.6;margin:8px 0 0 0;">
      Pour ne plus recevoir ces notifications, mettez votre fiche en pause depuis votre <a href="${baseUrl}/pro/dashboard/preferences" style="color:#999;">dashboard</a>.
    </p>

    <hr style="border:none;border-top:1px solid #E5E5E5;margin:32px 0 16px 0;">
    <p style="font-size:11px;color:#999;text-align:center;">
      Workwave &middot; <a href="${baseUrl}" style="color:#999;">workwave.fr</a> &middot; projet #${input.projectId}
    </p>
  </div>
</body></html>`;
}

async function sendOne(
  email: string,
  subject: string,
  html: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await getResendClient().emails.send({
      from: "Workwave <contact@workwave.fr>",
      to: [email],
      subject,
      html,
    });
    if (r.error) {
      return { ok: false, error: r.error.message || String(r.error) };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Marqueur d'un depot de test technique : un projet dont la description
 *  commence par cette phrase n'est JAMAIS diffuse aux artisans.
 *
 *  Pourquoi (28/08/2026) : en verifiant le nouveau formulaire de bout en bout,
 *  un projet de test est parti a trois artisans, dont deux vrais. Avoir choisi
 *  une categorie sans aucun pro reclame ne suffisait pas : les pros
 *  GENERALISTES (multiservice, petit bricolage) recoivent TOUS les projets BTP
 *  de leur zone, quelle que soit la categorie (cf. le commentaire du filtre
 *  categorie plus bas). Un faux chantier envoye a de vrais artisans abime le
 *  lien avec les rares pros reclames.
 *
 *  Le controle est ICI et non dans la Server Action, pour couvrir d'un seul
 *  endroit TOUS les appelants : le depot, le cron de rattrapage
 *  (broadcast-rescue) et la relance manuelle. Le mettre dans l'action laissait
 *  le cron rediffuser le projet quelques minutes plus tard.
 *
 *  Le marqueur est assez explicite pour qu'aucun particulier ne l'ecrive par
 *  hasard. Le reste du parcours (validation, insertion, qualification IA,
 *  mails admin et confirmation) s'execute normalement : c'est bien un test de
 *  bout en bout. */
const MARQUEUR_TEST = "TEST TECHNIQUE WORKWAVE";

export async function broadcastBtpProject(
  input: BroadcastBtpInput
): Promise<BroadcastBtpResult> {
  if (
    (input.projectDescription ?? "").trim().toUpperCase().startsWith(MARQUEUR_TEST)
  ) {
    console.log(
      `[broadcastBtpProject] projet ${input.projectId} : marqueur de test, AUCUNE diffusion aux artisans`
    );
    return { sent: 0, failed: 0, totalTargets: 0, errors: [] };
  }
  // baseUrl nettoyé (un espace/nbsp dans l'env casserait tous les liens du mail, leçon 18/04).
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr")
    .replace(/\s+/g, "")
    .replace(/\/+$/, "");
  // Type de relance, calcule une seule fois pour l'objet du mail ET la colonne
  // d'idempotence ecrite en fin de traitement (markProjectDone).
  const kind: "j1" | "j3" | null =
    input.relanceKind ?? (input.isRelance === true ? "j3" : null);
  const lieuSujet = input.projectCityName ? ` a ${input.projectCityName}` : "";
  const subject =
    kind === "j1"
      ? `Un projet ${input.projectCategoryName}${lieuSujet} vous attend · Workwave`
      : kind === "j3"
        ? `Rappel : projet ${input.projectCategoryName}${lieuSujet} toujours disponible · Workwave`
        : `Nouveau projet ${input.projectCategoryName}${lieuSujet} · Workwave`;

  const sb = getServiceClient();
  const nowIso = new Date().toISOString();

  // 1) Recuperer lat/lng + code postal de la ville du projet (matching distance + affichage email)
  let projectLat: number | null = null;
  let projectLng: number | null = null;
  let projectPostalCode: string | null = null;
  if (input.projectCityId != null) {
    const { data: projCity } = await sb
      .from("cities")
      .select("latitude, longitude, postal_code")
      .eq("id", input.projectCityId)
      .single();
    projectLat = (projCity?.latitude as number | null | undefined) ?? null;
    projectLng = (projCity?.longitude as number | null | undefined) ?? null;
    projectPostalCode = (projCity?.postal_code as string | null | undefined) ?? null;
  }

  // Email construit ici (apres le fetch ville) pour inclure le code postal.
  // Le HTML depend desormais du nombre de deblocages OFFERTS restants du
  // destinataire. On ne construit pas 1 HTML par pro (inutile) mais UN PAR
  // VALEUR possible : 2, 1 ou 0. Trois rendus au maximum, quelle que soit la
  // taille de la diffusion.
  const htmlParRestants = new Map<number, string>();
  const htmlPour = (restants: number): string => {
    let h = htmlParRestants.get(restants);
    if (!h) {
      h = buildEmailHtml(input, baseUrl, projectPostalCode, restants);
      htmlParRestants.set(restants, h);
    }
    return h;
  };

  // 2) Selection des pros BTP eligibles (categorie + claimed + actif).
  //    On NE filtre PAS par city_id en SQL : la bbox naive serait plafonnee
  //    a 1000 cities par PostgREST (leçon 09/05/2026, recidive du bug
  //    cap 1000). Le pool des pros claimed etant petit (~quelques dizaines
  //    aujourd'hui, ~quelques milliers cibles), filtrer 100% cote JS via
  //    Haversine sur le SELECT joint avec cities est plus simple et correct.
  //    NB : a l'echelle 50k+ pros claimed par categorie, il faudra introduire
  //    une vraie bbox paginee ou une RPC PostGIS, pas pour aujourd'hui.
  const useDistance = projectLat != null && projectLng != null;

  // Relance : ne JAMAIS re-notifier un pro qui a déjà débloqué ce projet, il a
  // déjà les coordonnées du particulier, le rappel "toujours disponible" serait
  // absurde (et énervant). On exclut ses id du SELECT.
  let excludeProIds: number[] = [];
  if (input.isRelance) {
    const { data: unlocks } = await sb
      .from("lead_unlocks")
      .select("pro_id")
      .eq("project_id", input.projectId);
    excludeProIds = (unlocks || [])
      .map((u: { pro_id: number | null }) => u.pro_id)
      .filter((id): id is number => id != null);
  }

  // Matching catégorie : si le projet est dans un cluster (génie climatique :
  // plombier+chauffagiste+climaticien), on cible les pros des 3 métiers. Sinon,
  // catégorie exacte. Un pro est éligible si sa catégorie principale OU une de
  // ses catégories secondaires figure dans l'ensemble ciblé.
  // + les pros GÉNÉRALISTES (multiservice / petit-bricolage) reçoivent TOUS les
  // projets BTP de leur zone (homme toutes mains = tous corps de métier). Sans
  // risque : pay-per-lead, le pro lit le descriptif avant de payer et filtre lui-même.
  const matchCategoryIds = await getMatchCategoryIds(sb, input.projectCategoryId);
  const generalistIds = await getGeneralistCategoryIds(sb);
  // Généraliste = métier PRINCIPAL uniquement. Le 26/08, une aide à domicile
  // (aide-seniors, secondaires ménage/repassage/multiservice) a reçu un projet
  // de CUISINISTE à 190 km parce que « multiservice » figurait dans ses
  // catégories secondaires : la règle la traitait en homme toutes mains. Une
  // catégorie secondaire cochée ne transforme personne en généraliste BTP.
  const categoryOrFilter = [
    ...matchCategoryIds.flatMap((id) => [
      `category_id.eq.${id}`,
      `secondary_category_ids.cs.{${id}}`,
    ]),
    ...generalistIds
      .filter((id) => !matchCategoryIds.includes(id))
      .map((id) => `category_id.eq.${id}`),
  ].join(",");

  let queryBuilder = sb
    .from("pros")
    .select(
      "id, email, name, paused_until, intervention_radius_km, city:cities!inner(latitude, longitude, department_id)"
    )
    .or(categoryOrFilter)
    // Whitelist de TOUTES les sources legitimes (lecon 26/05) : 'bce' =
    // registre belge (Belgique, 11/07). L'oublier = aucun pro belge ne
    // recevrait jamais un lead.
    .in("source", ["sirene", "pagesjaunes", "manual", "ai_signup", "bce"])
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("claimed_by_user_id", "is", null)
    .not("email", "is", null)
    .eq("do_not_contact", false)
    .or(`paused_until.is.null,paused_until.lt.${nowIso}`);

  // Exclut les pros ayant déjà débloqué ce projet (relance uniquement).
  if (excludeProIds.length > 0) {
    queryBuilder = queryBuilder.not("id", "in", `(${excludeProIds.join(",")})`);
  }

  // Fallback : si pas de lat/lng projet, on garde le filtre "meme departement"
  // via city_ids du dept (max ~1000 cities par dept, pas de cap atteint).
  if (!useDistance) {
    const { data: deptCities, error: deptErr } = await sb
      .from("cities")
      .select("id")
      .eq("department_id", input.projectDepartmentId);
    if (deptErr) {
      console.error("[broadcastBtpProject] dept cities error:", deptErr);
    }
    const deptCityIds = (deptCities || []).map((c: { id: number }) => c.id);
    if (deptCityIds.length === 0) {
      await markProjectDone(sb, input.projectId, kind, 0);
      return { totalTargets: 0, sent: 0, failed: 0, errors: ["no_cities_in_department"] };
    }
    queryBuilder = queryBuilder.in("city_id", deptCityIds);
  }

  const { data: pros, error: queryError } = await queryBuilder;

  if (queryError) {
    console.error("[broadcastBtpProject] query error:", queryError);
    await markProjectDone(sb, input.projectId, kind, 0);
    return { totalTargets: 0, sent: 0, failed: 0, errors: [queryError.message] };
  }

  // 4) Filtre exact Haversine (cote JS) : distance(pro, projet) <= rayon pro.
  //    Si on a pas la lat/lng projet, on garde tout le pool dept (fallback legacy).
  //    Si un pro n'a pas de lat/lng (city sans coords), on l'inclut par securite
  //    (= ne pas penaliser les pros a cause d'une donnee manquante cote BDD).
  type ProRow = {
    id: number;
    email: string | null;
    name: string;
    paused_until: string | null;
    intervention_radius_km: number | null;
    city: { latitude: number | null; longitude: number | null } | null;
  };
  const DEFAULT_RADIUS_KM = 200; // défaut large (décision Willy 14/06 : 200 km par défaut, le pro réduit ensuite via le slider)
  const targets = ((pros || []) as unknown as ProRow[]).filter(
    (
      p
    ): p is ProRow & { email: string } => {
      if (typeof p.email !== "string" || p.email.length === 0) return false;
      if (!useDistance) return true; // fallback dept : pas de filtre distance
      const proCity = p.city;
      if (!proCity || proCity.latitude == null || proCity.longitude == null) {
        return true; // pas de coords pro -> inclure par securite
      }
      const dist = haversineKm(
        proCity.latitude,
        proCity.longitude,
        projectLat as number,
        projectLng as number
      );
      const radius = p.intervention_radius_km ?? DEFAULT_RADIUS_KM;
      return dist <= radius;
    }
  );

  if (targets.length === 0) {
    // 0 pro eligible dans la zone (cas concret : projet #42 a Cenac, aucun
    // pro de la categorie ayant reclame sa fiche a portee). On appelle quand
    // meme markProjectDone : il ne marquera RIEN pour une diffusion initiale
    // a 0 envoi (cf. sa doc), ce qui laisse le projet rattrapable pendant 7
    // jours au cas ou un pro de la zone reclame sa fiche entre-temps.
    await markProjectDone(sb, input.projectId, kind, 0);
    return { totalTargets: 0, sent: 0, failed: 0, errors: [] };
  }

  // Compteurs de deblocages OFFERTS deja consommes, pour TOUS les
  // destinataires en UNE seule requete. Sans ca, il faudrait une requete par
  // pro : ici la diffusion peut toucher des centaines de personnes.
  const FREE_UNLOCK_COUNT = 2;
  const gratuitsUtilises = new Map<number, number>();
  {
    const { data: u } = await sb
      .from("lead_unlocks")
      .select("pro_id")
      .eq("amount_cents", 0)
      .in("pro_id", targets.map((t) => t.id));
    ((u || []) as { pro_id: number }[]).forEach((x) =>
      gratuitsUtilises.set(x.pro_id, (gratuitsUtilises.get(x.pro_id) || 0) + 1)
    );
  }
  const restantsDe = (proId: number) =>
    Math.max(0, FREE_UNLOCK_COUNT - (gratuitsUtilises.get(proId) || 0));

  // 3) Envoi en chunks de 50 (respect rate limit Resend ~10 req/s)
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
    const chunk = targets.slice(i, i + CHUNK_SIZE);
    const results = await Promise.all(
      chunk.map((t) => sendOne(t.email, subject, htmlPour(restantsDe(t.id))))
    );
    for (const r of results) {
      if (r.ok) {
        sent++;
      } else {
        failed++;
        if (errors.length < 10 && r.error) errors.push(r.error.slice(0, 200));
      }
    }
    if (i + CHUNK_SIZE < targets.length) {
      await sleep(CHUNK_DELAY_MS);
    }
  }

  // 4) Track le broadcast (ou la relance) en BDD
  await markProjectDone(sb, input.projectId, kind, sent);

  // 5) Trace QUI a reçu le projet (project_leads, status "sent") pour les stats
  //    admin "à qui c'est envoyé". N'insère que les pros pas déjà tracés (pas
  //    de contrainte unique → dédup côté code). Best-effort : un échec ici ne
  //    casse JAMAIS le broadcast (l'email est déjà parti).
  try {
    const { data: existing } = await sb
      .from("project_leads")
      .select("pro_id")
      .eq("project_id", input.projectId);
    const already = new Set((existing || []).map((r: { pro_id: number }) => r.pro_id));
    const sentAtIso = new Date().toISOString();
    const toInsert = targets
      .filter((t) => !already.has(t.id))
      .map((t) => ({
        project_id: input.projectId,
        pro_id: t.id,
        status: "sent" as const,
        sent_at: sentAtIso,
      }));
    if (toInsert.length > 0) {
      const { error: leadErr } = await sb.from("project_leads").insert(toInsert);
      if (leadErr) console.error("[broadcastBtpProject] project_leads insert KO:", leadErr.message);
    }
  } catch (e) {
    console.error("[broadcastBtpProject] tracking destinataires KO:", (e as Error).message);
  }

  return { totalTargets: targets.length, sent, failed, errors };
}
