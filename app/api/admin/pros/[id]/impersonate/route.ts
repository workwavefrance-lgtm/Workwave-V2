import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdmin } from "@/lib/admin/auth";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { sendImpersonationNotice } from "@/lib/email/send-impersonation-notice";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Superadmin uniquement
  if (admin.role !== "superadmin") {
    return NextResponse.json(
      { error: "Seuls les superadmins peuvent utiliser l'impersonation" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const proId = parseInt(id);
  const db = getAdminServiceClient();

  // Récupérer le pro
  const { data: pro } = (await db
    .from("pros")
    .select("id, name, email, slug, claimed_by_user_id")
    .eq("id", proId)
    .single()) as {
    data: {
      id: number;
      name: string;
      email: string;
      slug: string;
      claimed_by_user_id: string | null;
    } | null;
  };

  if (!pro) {
    return NextResponse.json({ error: "Pro introuvable" }, { status: 404 });
  }

  if (!pro.claimed_by_user_id) {
    return NextResponse.json(
      { error: "Cette fiche n'a pas été réclamée, impossible de s'y connecter" },
      { status: 400 }
    );
  }

  // Générer un magic link pour le pro
  const { data: linkData, error: linkError } =
    await db.auth.admin.generateLink({
      type: "magiclink",
      email: pro.email,
    });

  if (linkError || !linkData) {
    return NextResponse.json(
      { error: "Impossible de générer le lien de connexion" },
      { status: 500 }
    );
  }

  // Set cookie d'impersonation (httpOnly, 30min TTL)
  const cookieStore = await cookies();
  const impersonationData = JSON.stringify({
    adminId: admin.id,
    adminEmail: admin.email,
    proId: pro.id,
    proName: pro.name,
    startedAt: new Date().toISOString(),
  });

  cookieStore.set("admin_impersonation", impersonationData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 60, // 30 minutes
  });

  // Log dans admin_logs
  await db.from("admin_logs").insert({
    admin_id: admin.id,
    action: "pro.impersonate",
    entity_type: "pro",
    entity_id: pro.id,
    details: {
      pro_name: pro.name,
      pro_email: pro.email,
      started_at: new Date().toISOString(),
    },
  } as never);

  // Email de notification au pro (fire-and-forget)
  sendImpersonationNotice({
    proEmail: pro.email,
    proName: pro.name,
    adminEmail: admin.email,
    date: new Date(),
  }).catch((err) =>
    console.error("Erreur envoi email impersonation:", err)
  );

  // Extraire le token du lien et construire l'URL de confirmation
  const url = new URL(linkData.properties.action_link);
  const token = url.searchParams.get("token");
  const type = url.searchParams.get("type");

  // Construire l'URL de vérification via le endpoint Supabase Auth
  const verifyUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=${token}&type=${type}&redirect_to=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/pro/dashboard`)}`;

  return NextResponse.json({
    url: verifyUrl,
    proName: pro.name,
  });
}
