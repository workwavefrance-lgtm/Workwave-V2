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
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Connexion...</title>
<style>
  body{margin:0;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#FAFAFA;color:#0A0A0A;text-align:center;}
  .card{max-width:400px;margin:80px auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);}
  h2{margin:0 0 8px;font-size:20px;font-weight:700;}
  p{margin:0 0 20px;font-size:15px;color:#6B7280;line-height:1.6;}
  .btn{display:inline-block;background:#FF5A36;color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:15px;font-weight:600;}
  .spinner{width:32px;height:32px;border:3px solid #E5E7EB;border-top-color:#FF5A36;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px;}
  @keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div class="card" id="loading">
  <div class="spinner"></div>
  <p>Connexion en cours...</p>
</div>
<div class="card" id="inapp" style="display:none;">
  <h2>Ouvrez dans Safari</h2>
  <p>Votre application de messagerie utilise un navigateur intégré qui ne permet pas de conserver la session. Ouvrez ce lien dans Safari pour vous connecter.</p>
  <p id="inapp-instructions" style="font-size:13px;color:#9CA3AF;"></p>
  <a class="btn" id="open-link" href="#">Copier le lien</a>
</div>
<script>
  // Détection In-App Browser (iOS Mail, Gmail, Outlook, etc.)
  var ua = navigator.userAgent || '';
  var isInApp = /FBAN|FBAV|Instagram|Twitter|Line|Messenger|GSA/i.test(ua)
    || (/Safari/i.test(ua) === false && /AppleWebKit/i.test(ua) && /Mobile/i.test(ua));

  var hash = window.location.hash.substring(1);
  var searchParams = new URLSearchParams(window.location.search);
  var next = searchParams.get('next') || '/pro/dashboard';

  if (hash) {
    var params = new URLSearchParams(hash);
    var accessToken = params.get('access_token');
    var refreshToken = params.get('refresh_token');
    if (accessToken && refreshToken) {
      if (isInApp) {
        // In-App Browser détecté — proposer d'ouvrir dans le vrai navigateur
        var fullUrl = window.location.origin + '/auth/callback?access_token=' + encodeURIComponent(accessToken) + '&refresh_token=' + encodeURIComponent(refreshToken) + '&next=' + encodeURIComponent(next);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('inapp').style.display = 'block';
        document.getElementById('inapp-instructions').textContent = 'Appuyez sur le bouton ci-dessous pour copier le lien, puis collez-le dans Safari.';
        var btn = document.getElementById('open-link');
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          navigator.clipboard.writeText(fullUrl).then(function() {
            btn.textContent = 'Lien copié !';
            btn.style.background = '#22C55E';
          }).catch(function() {
            // Fallback : ouvrir directement
            window.location.href = fullUrl;
          });
        });
      } else {
        // Navigateur normal — rediriger avec les tokens en query params
        window.location.href = '/auth/callback?access_token=' + encodeURIComponent(accessToken) + '&refresh_token=' + encodeURIComponent(refreshToken) + '&next=' + encodeURIComponent(next);
      }
    } else {
      window.location.href = '/pro/connexion';
    }
  } else if (!isInApp) {
    window.location.href = '/pro/connexion';
  } else {
    // In-App browser sans hash — le hash peut être strippé
    var currentUrl = window.location.href.split('#')[0];
    document.getElementById('loading').style.display = 'none';
    document.getElementById('inapp').style.display = 'block';
    document.getElementById('inapp-instructions').textContent = 'Copiez ce lien et ouvrez-le dans Safari pour vous connecter.';
    var btn2 = document.getElementById('open-link');
    btn2.addEventListener('click', function(e) {
      e.preventDefault();
      navigator.clipboard.writeText(currentUrl).then(function() {
        btn2.textContent = 'Lien copié !';
        btn2.style.background = '#22C55E';
      }).catch(function() {
        window.location.href = '/pro/connexion';
      });
    });
  }
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
