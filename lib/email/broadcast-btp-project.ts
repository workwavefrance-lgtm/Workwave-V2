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
 *   - category_id = project.category_id OU project.category_id dans secondary_category_ids
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

let _resend: Resend | null = null;
function getResendClient(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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
  isRelance: boolean,
  sentCount: number
): Promise<void> {
  const update = isRelance
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
  /** Id de la ville du projet — utilise pour fetcher lat/lng et calculer la distance vs rayon des pros. */
  projectCityId: number | null;
  /** Fallback si la ville du projet n'a pas de lat/lng (filtre "meme departement"). */
  projectDepartmentId: number;
  isSuspicious: boolean;
  /** Mode relance J+3 : texte d'email plus doux + marque relance_sent_at au lieu de broadcasted_at (ne touche pas au compteur d'origine). */
  isRelance?: boolean;
};

export type BroadcastBtpResult = {
  totalTargets: number;
  sent: number;
  failed: number;
  errors: string[];
};

/**
 * Mappe les enums du form deposer-projet vers des libelles humains FR.
 * Si la valeur est inconnue, on la renvoie telle quelle (defensive — evite
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
    unknown: "Non précisé",
  };
  return m[value] ?? value;
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

function buildEmailHtml(input: BroadcastBtpInput, baseUrl: string): string {
  const previewDesc =
    input.projectDescription.length > 220
      ? input.projectDescription.slice(0, 220).trim() + "..."
      : input.projectDescription;
  const budgetLabel = humanBudget(input.projectBudget);
  const timelineLabel = humanUrgency(input.projectTimeline);

  // Mode relance J+3 : texte plus doux ("toujours disponible"), même mise en page.
  const isRelance = input.isRelance === true;
  const tagLabel = isRelance ? "RAPPEL PROJET" : "NOUVEAU PROJET";
  const headline = isRelance
    ? `Toujours disponible : projet ${input.projectCategoryName}${input.projectCityName ? ` à ${input.projectCityName}` : ""}`
    : `Nouveau projet ${input.projectCategoryName}${input.projectCityName ? ` à ${input.projectCityName}` : ""}`;
  const introText = isRelance
    ? "Ce projet est toujours en ligne et cherche un professionnel. Si vous souhaitez le traiter, c'est encore le moment — tout est dans votre dashboard."
    : "Un particulier de votre zone vient de publier une demande qui correspond à votre savoir-faire. Connectez-vous à votre dashboard pour la consulter.";

  const suspiciousBanner = input.isSuspicious
    ? `<div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;padding:12px 16px;margin:0 0 16px 0;">
        <p style="font-size:12px;color:#92400E;margin:0;font-weight:600;">
          &#9888; Projet flague par notre IA — verifiez avant de debloquer.
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
      <h2 style="font-size:18px;color:#0A0A0A;margin:0 0 12px 0;font-weight:700;">${input.projectTitle}</h2>
      <p style="font-size:13px;color:#525252;line-height:1.6;margin:0 0 16px 0;white-space:pre-wrap;">${previewDesc}</p>
      <table style="font-size:12px;width:100%;border-collapse:collapse;">
        ${budgetLabel ? `<tr><td style="padding:4px 0;color:#999;width:90px;">Budget</td><td style="color:#0A0A0A;font-weight:600;">${budgetLabel}</td></tr>` : ""}
        ${timelineLabel ? `<tr><td style="padding:4px 0;color:#999;">D&eacute;lai</td><td style="color:#0A0A0A;font-weight:600;">${timelineLabel}</td></tr>` : ""}
      </table>
    </div>

    <a href="${baseUrl}/pro/dashboard/leads" style="display:inline-block;background:#FF6803;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:0 0 24px 0;">
      Voir le projet &rarr;
    </a>

    <p style="font-size:12px;color:#525252;line-height:1.6;margin:24px 0 0 0;">
      <strong>Comment ca marche ?</strong> Acces gratuit a tous les projets de votre zone. Pour debloquer les coordonnees d'un particulier (telephone + email) et le contacter directement : ${UNLOCK_PRICE_EUR_TTC}&euro; TTC par projet. Sans engagement, sans abonnement, sans commission.
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

export async function broadcastBtpProject(
  input: BroadcastBtpInput
): Promise<BroadcastBtpResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";
  const subject = input.isRelance
    ? `Rappel : projet ${input.projectCategoryName}${input.projectCityName ? ` a ${input.projectCityName}` : ""} toujours disponible — Workwave`
    : `Nouveau projet ${input.projectCategoryName}${input.projectCityName ? ` a ${input.projectCityName}` : ""} — Workwave`;
  const html = buildEmailHtml(input, baseUrl);

  const sb = getServiceClient();
  const nowIso = new Date().toISOString();

  // 1) Recuperer lat/lng de la ville du projet (pour matching par distance)
  let projectLat: number | null = null;
  let projectLng: number | null = null;
  if (input.projectCityId != null) {
    const { data: projCity } = await sb
      .from("cities")
      .select("latitude, longitude")
      .eq("id", input.projectCityId)
      .single();
    projectLat = (projCity?.latitude as number | null | undefined) ?? null;
    projectLng = (projCity?.longitude as number | null | undefined) ?? null;
  }

  // 2) Selection des pros BTP eligibles (categorie + claimed + actif).
  //    On NE filtre PAS par city_id en SQL : la bbox naive serait plafonnee
  //    a 1000 cities par PostgREST (leçon 09/05/2026 — recidive du bug
  //    cap 1000). Le pool des pros claimed etant petit (~quelques dizaines
  //    aujourd'hui, ~quelques milliers cibles), filtrer 100% cote JS via
  //    Haversine sur le SELECT joint avec cities est plus simple et correct.
  //    NB : a l'echelle 50k+ pros claimed par categorie, il faudra introduire
  //    une vraie bbox paginee ou une RPC PostGIS — pas pour aujourd'hui.
  const useDistance = projectLat != null && projectLng != null;

  // Relance : ne JAMAIS re-notifier un pro qui a déjà débloqué ce projet — il a
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

  let queryBuilder = sb
    .from("pros")
    .select(
      "id, email, name, paused_until, intervention_radius_km, city:cities!inner(latitude, longitude, department_id)"
    )
    .or(
      `category_id.eq.${input.projectCategoryId},secondary_category_ids.cs.{${input.projectCategoryId}}`
    )
    .in("source", ["sirene", "pagesjaunes", "manual", "ai_signup"])
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
      await markProjectDone(sb, input.projectId, input.isRelance ?? false, 0);
      return { totalTargets: 0, sent: 0, failed: 0, errors: ["no_cities_in_department"] };
    }
    queryBuilder = queryBuilder.in("city_id", deptCityIds);
  }

  const { data: pros, error: queryError } = await queryBuilder;

  if (queryError) {
    console.error("[broadcastBtpProject] query error:", queryError);
    await markProjectDone(sb, input.projectId, input.isRelance ?? false, 0);
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
  const DEFAULT_RADIUS_KM = 100; // défaut élargi 20→100 km (décision Willy 11/06 : un inscrit rate trop de leads à 20 km)
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
    // 0 plombiers eligibles dans le departement (cas concret : projet #42
    // Laurent dans le 86, aucun plombier reclame). Track quand meme pour ne
    // pas laisser broadcasted_at=null indefiniment et pouvoir auditer.
    await markProjectDone(sb, input.projectId, input.isRelance ?? false, 0);
    return { totalTargets: 0, sent: 0, failed: 0, errors: [] };
  }

  // 3) Envoi en chunks de 50 (respect rate limit Resend ~10 req/s)
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
    const chunk = targets.slice(i, i + CHUNK_SIZE);
    const results = await Promise.all(
      chunk.map((t) => sendOne(t.email, subject, html))
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
  await markProjectDone(sb, input.projectId, input.isRelance ?? false, sent);

  return { totalTargets: targets.length, sent, failed, errors };
}
