import { getServiceClient } from "@/lib/supabase/service-client";
import { sendClaimSuccessAlert } from "@/lib/email/send-verification-code";
import { sendClaimWelcomeEmail } from "@/lib/email/send-claim-welcome";

// Notification admin (fire-and-forget) apres une reclamation reussie.
// Recupere les details du pro et envoie une alerte par email a ADMIN_EMAIL.
async function notifyAdminOfClaimSuccess(params: {
  slug: string;
  claimEmail: string;
  ip?: string;
}) {
  try {
    const serviceClient = await getServiceClient();
    const { data: pro } = await serviceClient
      .from("pros")
      .select(
        "id, slug, name, siret, cities(name), categories(name)"
      )
      .eq("slug", params.slug)
      .single();

    if (!pro) return;

    // cities et categories peuvent etre objets ou tableaux selon le shape
    type Joined = { name?: string } | { name?: string }[] | null;
    const pickName = (v: Joined): string | null => {
      if (!v) return null;
      if (Array.isArray(v)) return v[0]?.name ?? null;
      return v.name ?? null;
    };

    await sendClaimSuccessAlert({
      proId: pro.id,
      proName: pro.name,
      proSlug: pro.slug,
      proSiret: pro.siret,
      proCity: pickName(pro.cities as Joined),
      proCategory: pickName(pro.categories as Joined),
      claimEmail: params.claimEmail,
      ip: params.ip,
    });
  } catch (err) {
    console.error("notifyAdminOfClaimSuccess error :", err);
  }
}

// Notification PRO (fire-and-forget) apres une reclamation reussie.
// Envoie un mail de bienvenue au pro avec recap trial + avantages
// Workwave Pro + 3 conseils pour demarrer.
async function notifyProOfClaimSuccess(params: {
  slug: string;
  claimEmail: string;
}) {
  try {
    const serviceClient = await getServiceClient();
    const { data: pro } = await serviceClient
      .from("pros")
      .select(
        "name, category_id, secondary_category_ids, intervention_radius_km, cities(latitude, longitude, department_id)"
      )
      .eq("slug", params.slug)
      .single();

    if (!pro) return;

    // Projets DÉJÀ disponibles dans la zone du pro (hook « X projets vous
    // attendent déjà » dans le mail). Isolé dans son propre try/catch : si le
    // calcul échoue, le mail de bienvenue part quand même, sans le bloc.
    let availableProjects;
    try {
      const { getAvailableProjectsForPro } = await import(
        "@/lib/queries/available-projects"
      );
      const city = Array.isArray(pro.cities) ? pro.cities[0] : pro.cities;
      availableProjects = await getAvailableProjectsForPro(serviceClient, {
        category_id: pro.category_id,
        secondary_category_ids: pro.secondary_category_ids,
        intervention_radius_km: pro.intervention_radius_km,
        city: city ?? null,
      });
    } catch (e) {
      console.error("getAvailableProjectsForPro error :", e);
    }

    await sendClaimWelcomeEmail({
      email: params.claimEmail,
      proName: pro.name,
      availableProjects,
    });
  } catch (err) {
    console.error("notifyProOfClaimSuccess error :", err);
  }
}

// Notifs claim (mail admin + mail pro) : awaitées pour GARANTIR l'envoi (leçon
// 24/05 : une promesse détachée dans un Server Action est tuée au return ; le
// mail pro fait des requêtes DB → 06/06 : await le business-critique), MAIS
// bornées à 8 s par Promise.race : Resend n'a pas de timeout par défaut, un hang
// provider ne doit JAMAIS geler l'auto-login + le redirect du claim. Les 2
// fonctions notify* catchent déjà leurs erreurs → jamais de throw ici.
export async function sendClaimNotifications(params: {
  slug: string;
  claimEmail: string;
  ip?: string;
}) {
  await Promise.race([
    Promise.all([
      notifyAdminOfClaimSuccess(params),
      notifyProOfClaimSuccess({ slug: params.slug, claimEmail: params.claimEmail }),
    ]),
    new Promise((resolve) => setTimeout(resolve, 8000)),
  ]);
}
