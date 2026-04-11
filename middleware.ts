import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Rafraîchir la session (important pour les tokens expirés)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isProRoute = pathname.startsWith("/pro/dashboard");

  // Si pas de session, rediriger vers la bonne page de connexion
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = isAdminRoute ? "/admin/login" : "/pro/connexion";
    return NextResponse.redirect(url);
  }

  // Vérification admin : check table admins via service client
  if (isAdminRoute) {
    const adminVerified = request.cookies.get("admin_verified")?.value;
    const now = Date.now();

    // Cache de 5 minutes pour éviter un check DB à chaque requête
    if (adminVerified && now - parseInt(adminVerified, 10) < 5 * 60 * 1000) {
      return supabaseResponse;
    }

    // Vérifier dans la table admins via l'API route interne
    try {
      const checkUrl = new URL("/api/admin/auth/check", request.url);
      const checkResponse = await fetch(checkUrl.toString(), {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      });

      if (!checkResponse.ok) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        url.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(url);
      }

      // Marquer comme vérifié pendant 5 minutes
      supabaseResponse.cookies.set("admin_verified", String(now), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 5 * 60,
        path: "/",
      });
    } catch {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // Routes pro dashboard : la session suffit
  if (isProRoute) {
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/pro/dashboard/:path*", "/admin/:path*"],
};
