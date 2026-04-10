"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type LoginFormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export async function sendMagicLink(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const email = (formData.get("email") as string)?.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, errors: { email: "Adresse email invalide" } };
  }

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/pro/dashboard`,
    },
  });

  if (error) {
    return {
      success: false,
      message: "Impossible d'envoyer le lien de connexion. Réessayez.",
    };
  }

  return {
    success: true,
    message:
      "Un lien de connexion a été envoyé à votre adresse email. Vérifiez votre boîte de réception.",
  };
}
