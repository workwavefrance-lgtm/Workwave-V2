/**
 * POST /api/admin/projects/[id]/resend-notification
 *
 * Renvoie la notification admin pour un projet. Utilise par le
 * bouton "Renvoyer la notif" du dashboard admin quand
 * `projects.admin_notified_at IS NULL` (perte silencieuse possible
 * detectee — cf. projet #19 du 13/05 et migration 2026-05-23).
 *
 * sendProjectNotification trace lui-meme le resultat en base
 * (admin_notified_at ou admin_notification_error via
 * trackAdminNotification). Cet endpoint se contente de re-appeler
 * la fonction puis de relire le statut a jour.
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/auth";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { sendProjectNotification } from "@/lib/email/send-project-notification";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
  }

  const db = getAdminServiceClient();

  // Recuperer le projet + categorie + ville (joins).
  // Cast en Record<string, unknown> : les types Supabase ne sont pas
  // generes dans ce projet, le retour de .single() est typé `never`
  // -> on cast manuellement (pattern utilise ailleurs dans le code admin).
  const { data, error: fetchErr } = await db
    .from("projects")
    .select(
      "id, first_name, email, phone, description, urgency, budget, ai_qualification, suspicion_score, category:categories(name), city:cities(name, department:departments(name, code))"
    )
    .eq("id", projectId)
    .single();

  if (fetchErr || !data) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const project = data as unknown as Record<string, unknown>;
  const category = project.category as { name?: string } | null;
  const city = project.city as {
    name?: string;
    department?: { name?: string; code?: string } | { name?: string; code?: string }[] | null;
  } | null;
  const deptRel = city?.department;
  const deptObj = Array.isArray(deptRel) ? deptRel[0] : deptRel;
  const departmentName = deptObj?.name
    ? `${deptObj.name}${deptObj.code ? ` (${deptObj.code})` : ""}`
    : undefined;
  const suspicionScore = project.suspicion_score as number | null;

  // Re-appelle sendProjectNotification : elle tracke le resultat
  // en base (admin_notified_at ou admin_notification_error).
  await sendProjectNotification({
    firstName: (project.first_name as string) ?? "",
    email: (project.email as string) ?? "",
    phone: (project.phone as string) ?? "",
    categoryName: category?.name ?? "—",
    cityName: city?.name ?? "—",
    departmentName,
    description: (project.description as string) ?? "",
    urgency: (project.urgency as string) ?? "",
    budget: (project.budget as string) ?? "",
    aiQualification: project.ai_qualification as Record<string, unknown> | null,
    projectId: project.id as number,
    isSuspicious: suspicionScore !== null && suspicionScore > 70,
  });

  // Audit admin
  await db.from("admin_logs").insert({
    admin_id: admin.id,
    action: "resend_project_notification",
    entity_type: "project",
    entity_id: projectId,
  } as never);

  // Re-lire le statut a jour (set par trackAdminNotification)
  const { data: updatedRaw } = await db
    .from("projects")
    .select("admin_notified_at, admin_notification_error")
    .eq("id", projectId)
    .single();

  const updated = updatedRaw as unknown as
    | { admin_notified_at: string | null; admin_notification_error: string | null }
    | null;
  const adminNotifiedAt = updated?.admin_notified_at ?? null;
  const errorMessage = updated?.admin_notification_error ?? null;

  if (adminNotifiedAt) {
    return NextResponse.json({
      success: true,
      admin_notified_at: adminNotifiedAt,
    });
  }

  return NextResponse.json(
    {
      success: false,
      error: errorMessage ?? "Echec inconnu (pas de trace en base)",
    },
    { status: 500 }
  );
}
