"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type LoginFormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
};

// Rate limiting en mémoire : max 5 tentatives par email par 15 min
const loginAttempts = new Map<string, number[]>();
const LOGIN_WINDOW = 15 * 60 * 1000; // 15 min
const LOGIN_MAX = 5;

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(email) || [];
  const recent = attempts.filter((t) => now - t < LOGIN_WINDOW);
  loginAttempts.set(email, recent);
  return recent.length >= LOGIN_MAX;
}

function recordAttempt(email: string) {
  const attempts = loginAttempts.get(email) || [];
  attempts.push(Date.now());
  loginAttempts.set(email, attempts);
}

export async function signIn(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, errors: { email: "Adresse email invalide" } };
  }

  if (!password) {
    return { success: false, errors: { password: "Mot de passe requis" } };
  }

  // Rate limiting
  if (isRateLimited(email)) {
    return {
      success: false,
      message:
        "Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.",
    };
  }

  recordAttempt(email);

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
            // Ignoré si appelé depuis un Server Component en lecture seule
          }
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      message: "Email ou mot de passe incorrect.",
    };
  }

  redirect("/pro/dashboard");
}
