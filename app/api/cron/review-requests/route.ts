/**
 * Cron quotidien : sollicitation d'avis post-prestation.
 *
 * Logic :
 * 1. Trouve les projets crees il y a >= 7 jours avec :
 *    - review_requested_at IS NULL (pas deja sollicite)
 *    - status='routed' (au moins 1 pro contacte)
 *    - particulier_email non vide
 * 2. Pour chacun :
 *    - Recupere le 1er pro qui a recu le lead (project_leads)
 *    - Cree une review pending via createReviewRequest()
 *    - Envoie le mail via sendReviewRequest()
 *    - Marque project.review_requested_at = NOW()
 * 3. Limite a 50 par run pour eviter blast Resend
 * 4. Logs detailles par projet pour audit
 *
 * Cron : 11h chaque jour (heures ouvrables, l'user lit le mail dans
 * la journee → meilleur taux de soumission).
 *
 * Auth : Bearer ${CRON_SECRET}. Vercel ajoute automatiquement le
 * header pour les crons configures dans vercel.json.
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

  // 1. Trouve les projets eligibles : crees il y a >= 7 jours, pas
  // encore sollicites, avec routing reussi (status='routed').
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, first_name, email, category_id, city_id, created_at")
    .lt("created_at", sevenDaysAgo.toISOString())
    .is("review_requested_at", null)
    .eq("status", "routed")
    .not("email", "is", null)
    .order("created_at", { ascending: true })
    .limit(MAX_PER_RUN);

  if (projectsError) {
    console.error("[cron/review-requests] Erreur fetch projets :", projectsError.message);
    return NextResponse.json({ error: projectsError.message }, { status: 500 });
  }

  if (!projects || projects.length === 0) {
    return NextResponse.json({
      message: "Aucun projet éligible.",
      processed: 0,
    });
  }

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
    // 2. Trouve le 1er pro qui a recu le lead via project_leads
    const { data: leads } = await supabase
      .from("project_leads")
      .select("pro:pros(id, name, slug, city:cities(name))")
      .eq("project_id", p.id)
      .limit(1);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lead = leads?.[0] as any;
    const pro = lead?.pro;
    if (!pro || !pro.id) {
      // Pas de pro route → on marque quand meme requested_at pour
      // ne pas re-tenter chaque jour
      await supabase
        .from("projects")
        .update({ review_requested_at: new Date().toISOString() })
        .eq("id", p.id);
      results.push({
        project_id: p.id,
        ok: false,
        error: "Aucun pro routé sur ce projet",
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
