import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/pro/dashboard";

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;

  // Flow PKCE : échange du code contre une session
  if (code) {
    // Utiliser une réponse HTML (200) au lieu d'un redirect (302)
    // car Safari bloque les cookies posés pendant un redirect cross-origin
    const redirectUrl = new URL(next, baseUrl).toString();

    const response = new NextResponse(
      `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Connexion...</title></head>
<body><p>Connexion en cours...</p>
<script>window.location.href=${JSON.stringify(redirectUrl)};</script>
</body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );

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
      return response;
    }

    console.error("[auth/callback] erreur exchangeCodeForSession:", error.message);
  }

  // Pas de code — redirection vers la connexion
  return NextResponse.redirect(new URL("/pro/connexion", baseUrl));
}
