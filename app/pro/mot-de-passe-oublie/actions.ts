"use server";

import { generateResetToken } from "@/lib/utils/reset-token";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset";

export type ForgotPasswordState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, errors: { email: "Adresse email invalide" } };
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";

  const timestamp = Date.now();
  const token = generateResetToken(email, timestamp);

  const resetUrl = `${baseUrl}/pro/reinitialiser-mot-de-passe?email=${encodeURIComponent(email)}&ts=${timestamp}&token=${token}`;

  // Envoyer l'email (fire and forget — on ne révèle pas si le compte existe)
  try {
    await sendPasswordResetEmail(email, resetUrl);
  } catch (err) {
    console.error("[mot-de-passe-oublie] erreur envoi email:", err);
  }

  return {
    success: true,
    message:
      "Si un compte existe avec cette adresse, un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception.",
  };
}
