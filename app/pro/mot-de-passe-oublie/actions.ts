"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type ForgotPasswordState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = (formData.get("email") as string)?.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, errors: { email: "Adresse email invalide" } };
  }

  const cookieStore = await cookies();

  // Client avec flowType implicit pour que le lien de reset
  // redirige avec les tokens dans le hash fragment (#access_token=xxx)
  // au lieu du flow PKCE (?code=xxx) qui nécessite un code_verifier en cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "implicit",
      },
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
            // Ignoré si appelé depuis un Server Component en lecture seule
          }
        },
      },
    }
  );

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/pro/reinitialiser-mot-de-passe`,
  });

  // Toujours retourner succès pour ne pas révéler si le compte existe
  return {
    success: true,
    message:
      "Si un compte existe avec cette adresse, un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception.",
  };
}
