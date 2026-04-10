import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/pro/dashboard";

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;

  console.log("[auth/callback] params:", {
    code: code ? `${code.substring(0, 8)}...` : null,
    next,
    baseUrl,
  });

  if (code) {
    // Créer la response de redirection AVANT pour y écrire les cookies
    const redirectUrl = new URL(next, baseUrl);
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.log("[auth/callback] session créée, redirection vers", next);
      return response;
    }

    console.error("[auth/callback] erreur exchangeCodeForSession:", error.message);
  } else {
    console.warn("[auth/callback] pas de code dans les searchParams");
  }

  // Fallback : rediriger vers la connexion
  return NextResponse.redirect(new URL("/pro/connexion", baseUrl));
}
