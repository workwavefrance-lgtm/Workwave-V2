/**
 * Cron quotidien : rattrape les projets qui n'ont jamais été broadcastés.
 *
 * Filet de sécurité contre le bug `after()` Next 16 qui n'exécute pas
 * broadcastBtpProject() en prod. Sans ce filet, des projets restent invisibles
 * aux pros claimed → 0 unlock → 0€ de CA → perte sèche.
 *
 * Logique :
 * 1. SELECT projects WHERE broadcast_count = 0 AND status != 'deleted'
 *    AND created_at > NOW() - 14 days
 * 2. Pour chaque projet : appelle broadcastBtpProject() ou broadcastTechProject()
 *    selon le vertical.
 * 3. Log les résultats par projet.
 *
 * Auth : Bearer CRON_SECRET (Vercel cron natif).
 */
import { NextResponse } from "next/server";
import { broadcastBtpProject } from "@/lib/email/broadcast-btp-project";
import { broadcastTechProject } from "@/lib/email/broadcast-tech-project";
import { getServiceClient } from "@/lib/supabase/service-client";
import type { DeliveryKind } from "@/lib/email/project-delivery";

export const maxDuration = 300;


export async function GET(req: Request) {
  // 1. AUTH
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = getServiceClient();
  // 14 jours : un chantier reste d'actualite bien plus longtemps qu'une semaine,
  // et c'est la fenetre pendant laquelle un pro qui reclame sa fiche doit encore
  // recevoir par mail les projets restes sans preneur dans sa zone.
  const fenetreDebut = new Date(Date.now() - 14 * 86400e3).toISOString();
  const projectSelect = "id, first_name, description, category_id, city_id, budget, urgency, status, vertical, suspicion_score, created_at";

  // 2. Projets en attente
  const { data: projects, error } = await sb
    .from("projects")
    .select(projectSelect)
    .not("status", "in", "(deleted,closed)")
    .is("broadcasted_at", null)
    .gte("created_at", fenetreDebut)
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  // Rejoue aussi les échecs partiels J+1/J+3 sans attendre le cron quotidien :
  // la clé Resend expire après 24 h. Le journal est la seule preuve fiable ;
  // les anciens project_leads.status='sent' ne servent jamais de backfill.
  const { data: pending, error: pendingError } = await sb.from("project_email_deliveries")
    .select("project_id, kind")
    .is("sent_at", null)
    .gte("first_attempt_at", new Date(Date.now() - 23 * 3600e3).toISOString())
    .order("first_attempt_at")
    .limit(1000);
  if (pendingError) {
    return NextResponse.json({ ok: false, error: pendingError.message }, { status: 500 });
  }
  const { count: needsReview, error: reviewError } = await sb.from("project_email_deliveries")
    .select("project_id", { count: "exact", head: true })
    .is("sent_at", null)
    .lte("first_attempt_at", new Date(Date.now() - 23 * 3600e3).toISOString());
  if (reviewError) return NextResponse.json({ ok: false, error: reviewError.message }, { status: 500 });
  if (needsReview) {
    // La reprise automatique est finie : conserver les identifiants utiles à
    // la revue, mais plus les adresses et descriptions du mail.
    const { error: purgeError } = await sb.from("project_email_deliveries")
      .update({ recipient_email: "", subject: "", html: "", last_error: "delivery_needs_review: fenêtre de reprise expirée" })
      .is("sent_at", null)
      .lte("first_attempt_at", new Date(Date.now() - 23 * 3600e3).toISOString());
    if (purgeError) return NextResponse.json({ ok: false, error: purgeError.message }, { status: 500 });
  }
  const tasks = new Map((projects ?? []).map((p) => [`${p.id}/initial`, { project: p, kind: "initial" as DeliveryKind }]));
  const pendingIds = [...new Set((pending ?? []).map((p) => p.project_id))];
  if (pendingIds.length) {
    const { data: retryProjects, error: retryError } = await sb.from("projects")
      .select(projectSelect).in("id", pendingIds)
      .not("status", "in", "(deleted,closed)")
      .gte("created_at", new Date(Date.now() - 30 * 86400e3).toISOString());
    if (retryError) return NextResponse.json({ ok: false, error: retryError.message }, { status: 500 });
    const byId = new Map((retryProjects ?? []).map((p) => [p.id, p]));
    for (const d of pending ?? []) {
      const project = byId.get(d.project_id);
      const kind = d.kind as DeliveryKind;
      if (project && (kind === "initial" || project.vertical === "btp")) {
        tasks.set(`${project.id}/${kind}`, { project, kind });
      }
    }
  }
  if (tasks.size === 0) {
    return NextResponse.json({ ok: !needsReview, message: needsReview ? "Diffusions incertaines à vérifier" : "Rien à rattraper", checked: 0, needs_review: needsReview ?? 0 });
  }

  // 3. Broadcast un par un
  const results: Array<{ id: number; vertical: string; kind?: DeliveryKind; sent: number; total: number; error?: string }> = [];
  for (const { project: p, kind } of tasks.values()) {
    try {
      if (p.vertical === "btp") {
        const [{ data: cat }, { data: cit }] = await Promise.all([
          sb.from("categories").select("id, name").eq("id", p.category_id).single(),
          sb.from("cities").select("id, name, department_id").eq("id", p.city_id).single(),
        ]);
        if (!cat || !cit) {
          results.push({ id: p.id, vertical: "btp", sent: 0, total: 0, error: "cat ou ville introuvable" });
          continue;
        }
        const r = await broadcastBtpProject({
          projectId: p.id,
          projectTitle: p.description?.split("\n")[0].slice(0, 100) || "Nouveau projet",
          projectDescription: p.description || "",
          projectBudget: p.budget || null,
          projectTimeline: p.urgency || null,
          projectCategoryName: cat.name,
          projectCategoryId: cat.id,
          projectCityName: cit.name,
          projectCityId: cit.id,
          projectDepartmentId: cit.department_id,
          isSuspicious: (p.suspicion_score ?? 0) >= 50,
          ...(kind !== "initial" ? { relanceKind: kind } : {}),
        });
        results.push({ id: p.id, vertical: "btp", kind, sent: r.sent, total: r.totalTargets,
          ...(r.failed ? { error: r.errors.join("; ") } : {}),
        });
      } else if (p.vertical === "tech") {
        // Tech broadcast (workwave AI) : signature plus simple (pas de city, c'est remote)
        const { data: cat } = await sb.from("categories").select("id, name").eq("id", p.category_id).single();
        const r = await broadcastTechProject({
          projectId: p.id,
          projectTitle: p.description?.split("\n")[0].slice(0, 100) || "Nouveau projet",
          projectDescription: p.description || "",
          projectBudget: p.budget || null,
          projectTimeline: p.urgency || null,
          projectCategoryName: cat?.name || "AI",
          isSuspicious: (p.suspicion_score ?? 0) >= 50,
        });
        results.push({ id: p.id, vertical: "tech", kind, sent: r.sent, total: r.totalTargets,
          ...(r.failed ? { error: r.errors.join("; ") } : {}),
        });
      }
    } catch (e) {
      results.push({ id: p.id, vertical: p.vertical, sent: 0, total: 0, error: (e as Error).message });
    }
    // Anti-rate-limit Resend
    await new Promise((r) => setTimeout(r, 1500));
  }

  const totalSent = results.reduce((s, r) => s + r.sent, 0);
  return NextResponse.json({
    ok: !needsReview && results.every((r) => !r.error),
    checkedAt: new Date().toISOString(),
    projects_rescued: results.length,
    total_emails_sent: totalSent,
    needs_review: needsReview ?? 0,
    results,
  });
}
