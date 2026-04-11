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
    allParams: Object.fromEntries(searchParams.entries()),
  });

  // Flow PKCE : code dans les searchParams
  if (code) {
    const redirectUrl = new URL(next, baseUrl);
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: "implicit",
        },
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
      console.log("[auth/callback] session créée via code, redirection vers", next);
      return response;
    }

    console.error("[auth/callback] erreur exchangeCodeForSession:", error.message);
  }

  // Flow implicit : les tokens sont dans le hash fragment (#access_token=...)
  // Le hash n'arrive pas au serveur, on rend une page client qui le traite
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");

  if (accessToken && refreshToken) {
    const redirectUrl = new URL(next, baseUrl);
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: "implicit",
        },
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

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (!error) {
      console.log("[auth/callback] session créée via tokens, redirection vers", next);
      return response;
    }

    console.error("[auth/callback] erreur setSession:", error.message);
  }

  // Pas de code ni tokens — on sert une page HTML client-side
  // qui capture le hash fragment et redirige
  console.log("[auth/callback] pas de code/tokens, envoi page client hash handler");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Connexion...</title></head>
<body>
<p>Connexion en cours...</p>
<script>
  // Le hash fragment contient les tokens (flow implicit)
  const hash = window.location.hash.substring(1);
  if (hash) {
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (accessToken && refreshToken) {
      // Rediriger vers la même route avec les tokens en query params
      const next = new URLSearchParams(window.location.search).get('next') || '/pro/dashboard';
      window.location.href = '/auth/callback?access_token=' + encodeURIComponent(accessToken) + '&refresh_token=' + encodeURIComponent(refreshToken) + '&next=' + encodeURIComponent(next);
    } else {
      window.location.href = '/pro/connexion';
    }
  } else {
    window.location.href = '/pro/connexion';
  }
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
