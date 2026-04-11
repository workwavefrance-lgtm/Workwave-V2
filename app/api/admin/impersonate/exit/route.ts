import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const cookieStore = await cookies();

  // Lire les données d'impersonation avant suppression
  const raw = cookieStore.get("admin_impersonation")?.value;

  // Supprimer le cookie d'impersonation
  cookieStore.delete("admin_impersonation");

  // Déconnecter la session du pro
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Extraire le proId pour la redirection
  let proId: number | null = null;
  if (raw) {
    try {
      const data = JSON.parse(raw);
      proId = data.proId;
    } catch {
      // ignore
    }
  }

  return NextResponse.json({
    success: true,
    redirectTo: proId ? `/admin/pros/${proId}` : "/admin",
  });
}
