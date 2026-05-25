"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  markSigninAttemptComplete,
  markSigninAttemptFailed,
} from "@/lib/ai/auth/signin-code";
import { isValidEmail } from "@/lib/ai/helpers";

/**
 * Server Action verifyCode pour /ai/connexion/verifier :
 *   1. Recupere email + code depuis FormData
 *   2. Appelle auth.verifyOtp() (Supabase officiel) qui valide
 *      cryptographiquement le code, set la session via cookies HttpOnly.
 *   3. markSigninAttemptComplete() : tracking interne 'verified'.
 *   4. Redirect /ai/dashboard.
 *
 * Lecon #1+#2 du 26/05/2026 : on N'ECRASE PAS le password, on
 * NE STOCKE PAS de temp_password en clair. Supabase OTP gere tout :
 * cryptographie, expiry, replay, session.
 */

async function getServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore en lecture seule (RSC)
          }
        },
      },
    }
  );
}

export async function verifyCode(formData: FormData): Promise<void> {
  // Truncate defensif anti FormData forge
  const email = String(formData.get("email") || "").trim().toLowerCase().slice(0, 200);
  const code = String(formData.get("code") || "").trim().slice(0, 10);

  // Validation stricte
  if (!isValidEmail(email)) {
    redirect(`/ai/connexion/verifier?email=${encodeURIComponent(email)}&error=missing`);
  }
  // Code Supabase OTP : exactement 6 chiffres
  if (!/^\d{6}$/.test(code)) {
    redirect(`/ai/connexion/verifier?email=${encodeURIComponent(email)}&error=invalid_code`);
  }

  const supabase = await getServerSupabaseClient();

  // verifyOtp Supabase : valide cryptographiquement + set session cookies
  // type 'email' = code OTP envoye via auth.signInWithOtp
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });

  if (error || !data.session) {
    const errMsg = error?.message || "no_session";
    console.error("[verifyCode] OTP verify failed:", errMsg);

    // Track failure (sans leak du code en clair)
    await markSigninAttemptFailed(email, errMsg.slice(0, 100));

    // Mapping erreurs Supabase -> codes UI
    let uiError = "invalid_code";
    if (errMsg.includes("expired")) uiError = "expired";
    else if (errMsg.includes("attempt") || errMsg.includes("rate")) uiError = "blocked";
    else if (errMsg.includes("Token")) uiError = "invalid_code";

    redirect(
      `/ai/connexion/verifier?email=${encodeURIComponent(email)}&error=${uiError}`
    );
  }

  // Session active. Tracking.
  await markSigninAttemptComplete(email);

  redirect("/ai/dashboard");
}
