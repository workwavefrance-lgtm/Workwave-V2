import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/auth";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminServiceClient();
  const { data, error } = (await db
    .from("admins")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: true })) as {
    data: { id: number; email: string; role: string; created_at: string }[] | null;
    error: unknown;
  };

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ admins: data || [] });
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (admin.role !== "superadmin") {
    return NextResponse.json(
      { error: "Seuls les super-admins peuvent ajouter des admins" },
      { status: 403 }
    );
  }

  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim();

  if (!email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  // Verify the user exists in auth.users via Supabase auth admin API
  const db = getAdminServiceClient();

  // Check user exists in auth.users
  const supabase = await createClient();
  const {
    data: { users },
    error: listError,
  } = await supabase.auth.admin.listUsers();

  if (listError) {
    // Fall back: try to create admin entry anyway, FK constraint will fail if user doesn't exist
  }

  const authUser = users?.find((u) => u.email === email);
  if (!authUser) {
    return NextResponse.json(
      { error: "Aucun compte Workwave trouvé pour cet email. L'utilisateur doit d'abord créer un compte." },
      { status: 400 }
    );
  }

  // Check not already an admin
  const { data: existing } = (await db
    .from("admins")
    .select("id")
    .eq("email", email)
    .maybeSingle()) as { data: { id: number } | null };

  if (existing) {
    return NextResponse.json(
      { error: "Cet email est déjà administrateur" },
      { status: 409 }
    );
  }

  const { data: newAdmin, error: insertError } = (await db
    .from("admins")
    .insert({ user_id: authUser.id, email, role: "admin" } as never)
    .select("id, email, role, created_at")
    .single()) as unknown as {
    data: { id: number; email: string; role: string; created_at: string } | null;
    error: unknown;
  };

  if (insertError || !newAdmin) {
    return NextResponse.json(
      { error: "Erreur lors de l'ajout de l'administrateur" },
      { status: 500 }
    );
  }

  return NextResponse.json({ admin: newAdmin }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (admin.role !== "superadmin") {
    return NextResponse.json(
      { error: "Seuls les super-admins peuvent supprimer des admins" },
      { status: 403 }
    );
  }

  const url = request.nextUrl.searchParams;
  const id = parseInt(url.get("id") || "0");
  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  if (id === admin.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas supprimer votre propre compte" },
      { status: 400 }
    );
  }

  const db = getAdminServiceClient();
  const { error } = await db.from("admins").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
