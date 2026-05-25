"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  verifySigninCode,
  markSigninAttemptComplete,
} from "@/lib/ai/auth/signin-code";

/**
 * Server Action verifyCode pour /ai/connexion/verifier :
 *   1. Recupere email + code depuis FormData
 *   2. verifySigninCode() retourne le temp_password si OK
 *   3. signInWithPassword(email, temp_password) -> set cookies session
 *   4. markSigninAttemptComplete() : nullify temp_password
 *   5. Redirect /ai/dashboard
 */

async function signInAndSetCookies(email: string, password: string) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
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

  return supabase.auth.signInWithPassword({ email, password });
}

export async function verifyCode(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const code = String(formData.get("code") || "").trim();

  if (!email || !code) {
    redirect(`/ai/connexion/verifier?email=${encodeURIComponent(email)}&error=missing`);
  }

  const result = await verifySigninCode(email, code);

  if (!result.ok) {
    const reason = result.reason;
    redirect(
      `/ai/connexion/verifier?email=${encodeURIComponent(email)}&error=${reason}`
    );
  }

  // Code OK -> signInWithPassword (mot de passe temporaire genere par sendSigninCode)
  const { error: signInError } = await signInAndSetCookies(
    result.email,
    result.tempPassword
  );

  if (signInError) {
    console.error("[verifyCode] signIn error:", signInError.message);
    redirect(
      `/ai/connexion/verifier?email=${encodeURIComponent(email)}&error=signin_failed`
    );
  }

  // Cleanup : nullify temp_password
  await markSigninAttemptComplete(result.email);

  redirect("/ai/dashboard");
}
