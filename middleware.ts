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
  const isProRoute = pathname.startsWith("/pro/dashboard");
  const isAdminPage = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isAdminApi = pathname.startsWith("/api/admin");

  // Les API routes admin ne passent pas par le middleware (évite les boucles)
  if (isAdminApi) {
    return supabaseResponse;
  }

  // Routes pro dashboard : vérifier la session
  if (isProRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/pro/connexion";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Pages admin (pas les API) : vérifier session + admin
  if (isAdminPage) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

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

  return supabaseResponse;
}

export const config = {
  matcher: ["/pro/dashboard/:path*", "/admin/:path*", "/api/admin/:path*"],
};
