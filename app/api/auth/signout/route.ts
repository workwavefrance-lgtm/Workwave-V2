import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sameOriginRedirect } from "@/lib/auth/safe-redirect";

/**
 * GET /api/auth/signout : déconnecte l'utilisateur courant et redirige.
 *
 * Utilisé par les liens "Se déconnecter" dans /ai/dashboard et /pro/dashboard.
 * Méthode GET pour pouvoir utiliser un <a href> simple (pas de form).
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = new URL(req.url);
  const redirectTo = url.searchParams.get("redirect") || "/ai";
  return NextResponse.redirect(sameOriginRedirect(redirectTo, url.origin, "/ai"));
}
