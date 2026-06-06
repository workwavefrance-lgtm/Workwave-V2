/**
 * Cron quotidien : rattrape les projets qui n'ont jamais été broadcastés.
 *
 * Filet de sécurité contre le bug `after()` Next 16 qui n'exécute pas
 * broadcastBtpProject() en prod. Sans ce filet, des projets restent invisibles
 * aux pros claimed → 0 unlock → 0€ de CA → perte sèche.
 *
 * Logique :
 * 1. SELECT projects WHERE broadcast_count = 0 AND status != 'deleted'
 *    AND created_at > NOW() - 7 days
 * 2. Pour chaque projet : appelle broadcastBtpProject() ou broadcastTechProject()
 *    selon le vertical.
 * 3. Log les résultats par projet.
 *
 * Auth : Bearer CRON_SECRET (Vercel cron natif).
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { broadcastBtpProject } from "@/lib/email/broadcast-btp-project";
import { broadcastTechProject } from "@/lib/email/broadcast-tech-project";

export const maxDuration = 300;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: Request) {
  // 1. AUTH
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = getServiceClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400e3).toISOString();

  // 2. Projets en attente
  const { data: projects, error } = await sb
    .from("projects")
    .select("id, first_name, description, category_id, city_id, budget, urgency, status, vertical, suspicion_score, created_at")
    .neq("status", "deleted")
    .eq("broadcast_count", 0)
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!projects?.length) {
    return NextResponse.json({ ok: true, message: "Rien à rattraper", checked: 0 });
  }

  // 3. Broadcast un par un
  const results: Array<{ id: number; vertical: string; sent: number; total: number; error?: string }> = [];
  for (const p of projects) {
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
          projectDepartmentId: cit.department_id,
          isSuspicious: (p.suspicion_score ?? 0) >= 50,
        });
        results.push({ id: p.id, vertical: "btp", sent: r.sent, total: r.totalTargets });
      } else if (p.vertical === "tech") {
        // Tech broadcast (workwave AI) — appelle l'équivalent
        const [{ data: cat }, { data: cit }] = await Promise.all([
          sb.from("categories").select("id, name").eq("id", p.category_id).single(),
          sb.from("cities").select("id, name").eq("id", p.city_id).single(),
        ]);
        const r = await broadcastTechProject({
          projectId: p.id,
          projectTitle: p.description?.split("\n")[0].slice(0, 100) || "Nouveau projet",
          projectDescription: p.description || "",
          projectBudget: p.budget || null,
          projectTimeline: p.urgency || null,
          projectCategoryName: cat?.name || "AI",
          projectCityName: cit?.name || "Remote",
          isSuspicious: (p.suspicion_score ?? 0) >= 50,
        });
        results.push({ id: p.id, vertical: "tech", sent: r.sent, total: r.totalTargets });
      }
    } catch (e) {
      results.push({ id: p.id, vertical: p.vertical, sent: 0, total: 0, error: (e as Error).message });
    }
    // Anti-rate-limit Resend
    await new Promise((r) => setTimeout(r, 1500));
  }

  const totalSent = results.reduce((s, r) => s + r.sent, 0);
  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    projects_rescued: results.length,
    total_emails_sent: totalSent,
    results,
  });
}
