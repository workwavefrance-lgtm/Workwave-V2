"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const isReadyRef = useRef(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Garder le ref synchronisé avec le state
  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  const passwordValid = password.length >= 8 && /\d/.test(password);
  const passwordsMatch =
    password.length > 0 && passwordConfirm.length > 0 && password === passwordConfirm;
  const passwordsMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

  useEffect(() => {
    const supabase = createClient();

    console.log("[reset-password] page montée, URL:", window.location.href);
    console.log("[reset-password] search:", window.location.search);
    console.log("[reset-password] hash:", window.location.hash);

    // Écouter l'événement PASSWORD_RECOVERY (déclenché après échange du code)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        console.log("[reset-password] onAuthStateChange event:", event);
        if (event === "PASSWORD_RECOVERY") {
          setIsReady(true);
        }
      }
    );

    // Flow PKCE : Supabase redirige avec ?code=xxx
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      console.log("[reset-password] code PKCE détecté:", code.substring(0, 20) + "...");
      supabase.auth.exchangeCodeForSession(code).then(async ({ data, error: exchangeError }) => {
        console.log("[reset-password] exchangeCodeForSession result:", {
          hasSession: !!data?.session,
          hasUser: !!data?.user,
          userId: data?.user?.id,
          errorMessage: exchangeError?.message,
          errorStatus: exchangeError?.status,
          errorName: exchangeError?.name,
          fullError: exchangeError ? JSON.stringify(exchangeError) : null,
        });
        if (exchangeError) {
          setError(`Erreur: ${exchangeError.message}`);
          setIsReady(true);
          return;
        }
        // Vérifier la session après échange
        const { data: sessionData } = await supabase.auth.getSession();
        console.log("[reset-password] getSession après échange:", {
          hasSession: !!sessionData?.session,
          userId: sessionData?.session?.user?.id,
          email: sessionData?.session?.user?.email,
        });
        // Le PASSWORD_RECOVERY event sera déclenché par onAuthStateChange
        // Fallback au cas où l'event ne se déclenche pas
        setTimeout(() => {
          if (!isReadyRef.current) {
            console.log("[reset-password] fallback: forçage isReady après échange réussi");
            setIsReady(true);
          }
        }, 1000);
        // Nettoyer l'URL
        window.history.replaceState({}, "", window.location.pathname);
      });
    }

    // Flow implicit fallback : tokens dans le hash fragment
    const hash = window.location.hash.substring(1);
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      console.log("[reset-password] hash fragment détecté, type:", type);

      if (accessToken && refreshToken && type === "recovery") {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(({ error: sessionError }) => {
          console.log("[reset-password] setSession result:", { error: sessionError?.message });
          if (!sessionError) {
            setIsReady(true);
            window.history.replaceState({}, "", window.location.pathname);
          } else {
            setError("Le lien de réinitialisation est invalide ou a expiré.");
            setIsReady(true);
          }
        });
      }
    }

    // Timeout : si rien ne se passe après 10s, afficher un message
    const timeout = setTimeout(() => {
      if (!isReadyRef.current) {
        console.log("[reset-password] timeout 10s, lien invalide");
        setError("Le lien de réinitialisation est invalide ou a expiré. Veuillez en demander un nouveau.");
        setIsReady(true);
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!passwordValid || !passwordsMatch) return;

    setIsPending(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError("Erreur lors de la mise à jour du mot de passe. Veuillez réessayer.");
        return;
      }

      setSuccess(true);

      // Redirection après 2 secondes
      setTimeout(() => {
        window.location.href = "/pro/connexion";
      }, 2000);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsPending(false);
    }
  }

  const inputBase =
    "w-full h-12 px-4 rounded-xl border bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-250 outline-none";
  const inputNormal =
    "border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20";
  const inputError = "border-red-500 focus:ring-2 focus:ring-red-500/20";

  // Succès
  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-primary)]">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            Mot de passe mis à jour
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Votre mot de passe a été modifié avec succès. Redirection vers la page de connexion...
          </p>
          <Link
            href="/pro/connexion"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Se connecter maintenant
          </Link>
        </div>
      </main>
    );
  }

  // Lien invalide ou expiré (erreur avant d'avoir le formulaire)
  if (isReady && error && !password) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-primary)]">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            Lien expiré
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            {error}
          </p>
          <Link
            href="/pro/mot-de-passe-oublie"
            className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3 rounded-full text-sm font-semibold transition-all duration-250"
          >
            Demander un nouveau lien
          </Link>
        </div>
      </main>
    );
  }

  // Page non prête (échange du code en cours)
  if (!isReady) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-primary)]">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-4">
            <svg
              className="animate-spin h-6 w-6 text-[var(--text-tertiary)]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Vérification du lien de réinitialisation...
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-4">
            Si cette page ne se charge pas,{" "}
            <Link href="/pro/mot-de-passe-oublie" className="text-[var(--accent)] hover:underline">
              demandez un nouveau lien
            </Link>
            .
          </p>
        </div>
      </main>
    );
  }

  // Formulaire de réinitialisation
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-primary)]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-2xl font-bold text-[var(--text-primary)] tracking-tight"
          >
            Workwave
          </Link>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Choisissez un nouveau mot de passe
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Erreur */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Nouveau mot de passe */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Minimum 8 caractères"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputBase} pr-12 ${inputNormal}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                  tabIndex={-1}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                Minimum 8 caractères dont au moins 1 chiffre
              </p>
            </div>

            {/* Confirmation */}
            <div>
              <label
                htmlFor="passwordConfirm"
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  id="passwordConfirm"
                  type={showPasswordConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Retapez votre mot de passe"
                  required
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className={`${inputBase} pr-12 ${
                    passwordsMismatch
                      ? inputError
                      : passwordsMatch
                      ? "border-green-500 focus:ring-2 focus:ring-green-500/20"
                      : inputNormal
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                  tabIndex={-1}
                >
                  <EyeIcon open={showPasswordConfirm} />
                </button>
              </div>
              {passwordsMatch && (
                <p className="mt-1.5 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Les mots de passe correspondent
                </p>
              )}
              {passwordsMismatch && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending || !passwordValid || passwordsMismatch}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02] disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Mise à jour...
                </>
              ) : (
                "Mettre à jour le mot de passe"
              )}
            </button>
          </form>
        </div>

        {/* Retour connexion */}
        <p className="text-center text-sm text-[var(--text-tertiary)] mt-6">
          <Link
            href="/pro/connexion"
            className="text-[var(--accent)] hover:underline transition-colors duration-250"
          >
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
