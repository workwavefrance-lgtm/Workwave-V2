"use server";

import { verifyResetToken } from "@/lib/utils/reset-token";
import { createClient } from "@supabase/supabase-js";

export type ResetPasswordState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
};

async function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const ts = formData.get("ts") as string;
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const passwordConfirm = formData.get("passwordConfirm") as string;

  // Vérifier le token HMAC
  if (!email || !ts || !token) {
    return { success: false, message: "Lien de réinitialisation invalide." };
  }

  const timestamp = parseInt(ts, 10);
  if (isNaN(timestamp) || !verifyResetToken(email, timestamp, token)) {
    return {
      success: false,
      message: "Ce lien a expiré ou est invalide. Veuillez en demander un nouveau.",
    };
  }

  // Valider le mot de passe
  if (!password || password.length < 8) {
    return {
      success: false,
      errors: { password: "Le mot de passe doit contenir au moins 8 caractères" },
    };
  }

  if (!/\d/.test(password)) {
    return {
      success: false,
      errors: { password: "Le mot de passe doit contenir au moins 1 chiffre" },
    };
  }

  if (password !== passwordConfirm) {
    return {
      success: false,
      errors: { passwordConfirm: "Les mots de passe ne correspondent pas" },
    };
  }

  // Trouver l'utilisateur par email via admin API
  const serviceClient = await getServiceClient();
  const { data: listData } = await serviceClient.auth.admin.listUsers();
  const user = listData?.users?.find((u) => u.email === email);

  if (!user) {
    return {
      success: false,
      message: "Aucun compte trouvé avec cette adresse email.",
    };
  }

  // Mettre à jour le mot de passe via admin API
  const { error } = await serviceClient.auth.admin.updateUserById(user.id, {
    password,
  });

  if (error) {
    console.error("[reset-password] erreur updateUserById:", error.message);
    return {
      success: false,
      message: "Erreur lors de la mise à jour du mot de passe. Veuillez réessayer.",
    };
  }

  return { success: true };
}
