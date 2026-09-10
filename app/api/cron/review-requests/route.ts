/**
 * Cron quotidien : sollicitation d'avis post-prestation.
 *
 * 10/09/2026 : REECRIT. Depuis mai, cette tache n'avait JAMAIS rien envoye
 * (0 demande, 0 avis en base). Elle cherchait les projets au statut
 * « routed », un statut de l'ancien modele (abonnement + routing aux 3
 * meilleurs) que plus rien ne pose depuis le passage au 9,90 EUR : les
 * projets restent « new » (30 sur 30 en septembre). Tous les matins a 11h
 * elle trouvait un tiroir vide et repondait 200 « aucun projet eligible ».
 *
 * Nouveau critere, decide par Willy : un avis a du sens quand un artisan a
 * VRAIMENT eu le contact, donc quand il a DEBLOQUE les coordonnees
 * (table lead_unlocks, offert ou paye). 7 jours apres le premier deblocage
 * d'un projet, on demande au particulier de noter CET artisan-la.
 *
 * Logique :
 * 1. Deblocages vieux de 7 a 30 jours, hors comptes de test. Au-dela de 30
 *    jours on ne sollicite plus (regle des 30 jours de Willy, et le mail
 *    parle d'un contact recent) : l'arriere de mai a aout n'est pas rejoue.
 * 2. Un seul avis par projet, sur l'artisan du PREMIER deblocage ; projet
 *    non supprime, non suspect, jamais sollicite, avec un email.
 * 3. Pour chacun : desinscrits ecartes, review pending via
 *    createReviewRequest(), mail via sendReviewRequest(), puis
 *    project.review_requested_at = NOW() (anti-doublon).
 * 4. Limite a 50 par passage. `?dry=1` liste les candidats sans rien
 *    envoyer ni ecrire.
 *
 * Cron : 11h chaque jour. Auth : Bearer CRON_SECRET (crontab du VPS).
 */
import { NextResponse } from "next/server";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { createReviewRequest } from "@/lib/queries/reviews";
import { sendReviewRequest } from "@/lib/email/send-review-request";

export const maxDuration = 60;

const MAX_PER_RUN = 50;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase: DB = getAdminServiceClient();
  const dry = new URL(req.url).searchParams.get("dry") === "1";

  // 1. Deblocages vieux de 7 a 30 jours, hors comptes de test.
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 86400e3).toISOString();
  const thirtyDaysAgo = new Date(now - 30 * 86400e3).toISOString();
  const { data: unlocks, error: unlocksError } = await supabase
    .from("lead_unlocks")
    .select("project_id, pro_id, created_at")
    .lte("created_at", sevenDaysAgo)
    .gte("created_at", thirtyDaysAgo)
    .not("pro_id", "in", "(4393,99999,1432477)")
    .order("created_at", { ascending: true })
    .limit(500);
  if (unlocksError) {
    console.error("[cron/review-requests] Erreur fetch deblocages :", unlocksError.message);
    return NextResponse.json({ error: unlocksError.message }, { status: 500 });
  }
  // Premier deblocage par projet.
  const premierParProjet = new Map<number, { pro_id: number; created_at: string }>();
  for (const u of (unlocks ?? []) as Array<{ project_id: number; pro_id: number; created_at: string }>) {
    if (!premierParProjet.has(u.project_id)) premierParProjet.set(u.project_id, u);
  }
  if (premierParProjet.size === 0) {
    return NextResponse.json({ message: "Aucun deblocage de 7 a 30 jours.", processed: 0, dry });
  }

  // 2. Les projets correspondants, jamais sollicites, avec un email.
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, first_name, email, category_id, city_id, created_at")
    .in("id", Array.from(premierParProjet.keys()))
    .is("review_requested_at", null)
    .not("status", "in", "(deleted,suspicious)")
    .not("email", "is", null)
    .order("created_at", { ascending: true })
    .limit(MAX_PER_RUN);
  if (projectsError) {
    console.error("[cron/review-requests] Erreur fetch projets :", projectsError.message);
    return NextResponse.json({ error: projectsError.message }, { status: 500 });
  }
  if (!projects || projects.length === 0) {
    return NextResponse.json({
      message: "Aucun projet éligible (deblocages deja sollicites ou sans email).",
      deblocages: premierParProjet.size,
      processed: 0,
      dry,
    });
  }

  // Les artisans du premier deblocage, en une requete.
  const proIds = Array.from(new Set(projects.map((p: { id: number }) => premierParProjet.get(p.id)!.pro_id)));
  const { data: prosRows, error: prosError } = await supabase
    .from("pros")
    .select("id, name, slug, city:cities(name)")
    .in("id", proIds);
  if (prosError) {
    console.error("[cron/review-requests] Erreur fetch pros :", prosError.message);
    return NextResponse.json({ error: prosError.message }, { status: 500 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proParId = new Map<number, any>(((prosRows ?? []) as any[]).map((r) => [r.id, r]));

  if (dry) {
    return NextResponse.json({
      dry: true,
      candidats: projects.map((p: { id: number; email: string; created_at: string }) => ({
        project_id: p.id,
        projet_depose_le: p.created_at.slice(0, 10),
        debloque_le: premierParProjet.get(p.id)!.created_at.slice(0, 10),
        pro: proParId.get(premierParProjet.get(p.id)!.pro_id)?.name ?? `pro ${premierParProjet.get(p.id)!.pro_id} introuvable`,
        email_masque: p.email.replace(/^(.).*(@.*)$/, "$1***$2"),
      })),
    });
  }

  // Charge en bulk les emails desinscrits pour eviter N+1 queries
  const candidateEmails = (
    projects as Array<{ email: string }>
  ).map((p) => p.email.toLowerCase().trim());
  const { data: unsubRows } = await supabase
    .from("review_unsubscribes")
    .select("email")
    .in("email", candidateEmails);
  const unsubscribedSet = new Set(
    ((unsubRows as Array<{ email: string }> | null) ?? []).map((r) => r.email)
  );

  const results: Array<{
    project_id: number;
    pro_name?: string;
    ok: boolean;
    error?: string;
  }> = [];

  for (const p of projects as Array<{
    id: number;
    first_name: string;
    email: string;
    category_id: number;
    city_id: number;
  }>) {
    // Skip les emails desinscrits (RGPD + delivery)
    if (unsubscribedSet.has(p.email.toLowerCase().trim())) {
      await supabase
        .from("projects")
        .update({ review_requested_at: new Date().toISOString() })
        .eq("id", p.id);
      results.push({
        project_id: p.id,
        ok: false,
        error: "Particulier désinscrit",
      });
      continue;
    }
    // 2. L'artisan du premier deblocage de ce projet.
    const pro = proParId.get(premierParProjet.get(p.id)!.pro_id);
    if (!pro || !pro.id) {
      // Fiche disparue entre-temps : on marque pour ne pas re-tenter chaque jour.
      await supabase
        .from("projects")
        .update({ review_requested_at: new Date().toISOString() })
        .eq("id", p.id);
      results.push({
        project_id: p.id,
        ok: false,
        error: "Artisan du deblocage introuvable",
      });
      continue;
    }

    // 3. Cree review pending + envoie le mail
    const reviewResult = await createReviewRequest({
      proId: pro.id,
      projectId: p.id,
      particulierEmail: p.email,
      particulierName: p.first_name,
      verified: true,
    });
    if (!reviewResult) {
      results.push({
        project_id: p.id,
        pro_name: pro.name,
        ok: false,
        error: "Erreur création review pending",
      });
      continue;
    }

    const mailResult = await sendReviewRequest({
      particulierEmail: p.email,
      particulierName: p.first_name,
      proName: pro.name,
      proSlug: pro.slug,
      proCity: pro.city?.name ?? null,
      token: reviewResult.token,
    });

    if (!mailResult.ok) {
      console.error(
        `[cron/review-requests] Mail KO project=${p.id} : ${mailResult.error}`
      );
      results.push({
        project_id: p.id,
        pro_name: pro.name,
        ok: false,
        error: mailResult.error,
      });
      // On ne marque PAS review_requested_at pour reessayer demain
      continue;
    }

    // 4. Marque le projet comme sollicite (anti-doublon)
    await supabase
      .from("projects")
      .update({ review_requested_at: new Date().toISOString() })
      .eq("id", p.id);

    results.push({
      project_id: p.id,
      pro_name: pro.name,
      ok: true,
    });
  }

  const summary = {
    processed: results.length,
    sent: results.filter((r) => r.ok).length,
    skipped: results.filter((r) => !r.ok).length,
    results,
  };
  console.log("[cron/review-requests] Done :", JSON.stringify(summary, null, 2));
  return NextResponse.json(summary);
}
