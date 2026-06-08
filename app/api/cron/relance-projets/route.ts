/**
 * Cron quotidien : relance "projet toujours disponible" à J+3.
 *
 * But : un projet BTP publié il y a ~3 jours et toujours en ligne mérite un
 * petit rappel gentil aux pros de sa catégorie (principale + secondaires) dans
 * leur zone — le particulier attend toujours, et un pro a peut-être loupé le
 * 1er mail.
 *
 * Simple + fiable :
 *   - Réutilise broadcastBtpProject({ isRelance: true }) → MÊME ciblage exact
 *     (catégorie + rayon Haversine + pro inscrit + pas en pause), juste un
 *     texte d'email plus doux. Zéro duplication de logique.
 *   - relance_sent_at garantit UNE SEULE relance par projet (idempotent).
 *   - Fenêtre [J-14 ; J-3] : on relance les projets de 3 à 14 jours (au-delà,
 *     "toujours dispo" n'a plus de sens). Robuste si le cron saute un jour.
 *
 * Sélection : vertical='btp', status != 'deleted', broadcast_count > 0
 *   (= a bien été diffusé ; les jamais-diffusés sont gérés par broadcast-rescue),
 *   relance_sent_at IS NULL, broadcasted_at dans [J-14 ; J-3].
 *
 * Auth : Bearer CRON_SECRET (Vercel cron natif).
 * Test : GET ...?dry=1  → liste ce qui SERAIT relancé, sans rien envoyer.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { broadcastBtpProject } from "@/lib/email/broadcast-btp-project";

export const maxDuration = 300;

const MAX_PER_RUN = 100; // garde-fou anti-flood (au cas où un gros backlog)

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: Request) {
  // 1. AUTH (le mode dry reste protégé : on ne veut pas exposer la liste des projets)
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = new URL(req.url).searchParams.get("dry") === "1";
  const sb = getServiceClient();
  const now = Date.now();
  const threeDaysAgo = new Date(now - 3 * 86400e3).toISOString();
  const fourteenDaysAgo = new Date(now - 14 * 86400e3).toISOString();

  // 2. Projets à relancer
  const { data: projects, error } = await sb
    .from("projects")
    .select("id, description, category_id, city_id, budget, urgency, suspicion_score, broadcasted_at, broadcast_count")
    .eq("vertical", "btp")
    .neq("status", "deleted")
    .gt("broadcast_count", 0)
    .is("relance_sent_at", null)
    .lte("broadcasted_at", threeDaysAgo)
    .gte("broadcasted_at", fourteenDaysAgo)
    .order("broadcasted_at", { ascending: true })
    .limit(MAX_PER_RUN);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!projects?.length) {
    return NextResponse.json({ ok: true, message: "Aucun projet à relancer", relanced: 0, dryRun });
  }

  // Mode test : on liste sans envoyer
  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      wouldRelance: projects.length,
      projects: projects.map((p) => ({
        id: p.id,
        category_id: p.category_id,
        city_id: p.city_id,
        broadcasted_at: p.broadcasted_at,
        first_broadcast_count: p.broadcast_count,
      })),
    });
  }

  // 3. Relance un par un (réutilise le broadcast existant en mode relance)
  const results: Array<{ id: number; sent: number; total: number; error?: string }> = [];
  for (const p of projects) {
    try {
      const [{ data: cat }, { data: cit }] = await Promise.all([
        sb.from("categories").select("id, name").eq("id", p.category_id).single(),
        sb.from("cities").select("id, name, department_id").eq("id", p.city_id).single(),
      ]);
      if (!cat || !cit) {
        results.push({ id: p.id, sent: 0, total: 0, error: "cat ou ville introuvable" });
        continue;
      }
      const r = await broadcastBtpProject({
        projectId: p.id,
        projectTitle: p.description?.split("\n")[0].slice(0, 100) || "Projet",
        projectDescription: p.description || "",
        projectBudget: p.budget || null,
        projectTimeline: p.urgency || null,
        projectCategoryName: cat.name,
        projectCategoryId: cat.id,
        projectCityName: cit.name,
        projectCityId: cit.id,
        projectDepartmentId: cit.department_id,
        isSuspicious: (p.suspicion_score ?? 0) >= 50,
        isRelance: true,
      });
      results.push({ id: p.id, sent: r.sent, total: r.totalTargets });
    } catch (e) {
      results.push({ id: p.id, sent: 0, total: 0, error: (e as Error).message });
    }
    // Anti-rate-limit Resend (comme broadcast-rescue)
    await new Promise((r) => setTimeout(r, 1500));
  }

  const totalSent = results.reduce((s, r) => s + r.sent, 0);
  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    projects_relanced: results.length,
    total_emails_sent: totalSent,
    results,
  });
}
