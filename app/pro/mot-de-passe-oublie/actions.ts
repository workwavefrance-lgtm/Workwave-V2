"use server";

import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();

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
