import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
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
  const isAiRoute =
    pathname.startsWith("/ai/dashboard") ||
    pathname.startsWith("/en/ai/dashboard");
  const isAdminPage = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isAdminLogin = pathname === "/admin/login";

  // Pages publiques admin et API routes : juste rafraîchir session, pas de check
  if (isAdminApi || isAdminLogin) {
    return supabaseResponse;
  }

  // Routes pro dashboard (BTP) : vérifier la session
  if (isProRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/pro/connexion";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Routes AI dashboard (tech) : vérifier la session (defense en profondeur,
  // le layout.tsx fait deja un check + verif category_id 43-48, mais le
  // middleware bloque plus tot et evite de charger un layout/page inutilement)
  if (isAiRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.startsWith("/en/ai/dashboard")
        ? "/en/ai/connexion"
        : "/ai/connexion";
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

    // Verification DIRECTE dans la table admins.
    //
    // AVANT : le middleware appelait /api/admin/auth/check par un fetch sur
    // `request.url`, donc sur l'URL PUBLIQUE. Sur Vercel, l'edge court-circuitait
    // ce trajet. Sur un serveur unique, la requete sortait sur Internet (DNS +
    // TLS + proxy) pour revenir au MEME processus Node — deja charge par le
    // crawl. Resultat le 03/08 : la connexion admin restait bloquee sur
    // "Connexion...". Ici on interroge la base directement : plus aucun
    // aller-retour reseau.
    //
    // Cle de service obligatoire : la table `admins` a RLS active SANS policy,
    // donc invisible au client anon (c'etait la raison d'etre de l'API route).
    try {
      const service = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      const { data: adminRow } = await service
        .from("admins")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!adminRow) {
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
  matcher: [
    "/pro/dashboard/:path*",
    "/ai/dashboard/:path*",
    "/en/ai/dashboard/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
