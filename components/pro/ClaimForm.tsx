"use client";

import { useState } from "react";
import { useActionState } from "react";
import { submitClaim, type ClaimFormState } from "@/app/(public)/pro/reclamer/[slug]/actions";

type Props = {
  slug: string;
  // SIRET masqué (ex. "508 056 249 0••••") affiché en placeholder : le pro
  // "confirme" un numéro déjà montré plutôt que de le saisir à l'aveugle.
  maskedSiret: string;
  // Fiche belge : le numéro est un BCE 10 chiffres (format 1016.514.072),
  // pas un SIRET 14 chiffres. Adapte label, format et maxLength.
  isBelgian?: boolean;
};

const initialState: ClaimFormState = { success: false };

function formatBce(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)}.${digits.slice(4)}`;
  return `${digits.slice(0, 4)}.${digits.slice(4, 7)}.${digits.slice(7)}`;
}

function formatSiret(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
}

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

export default function ClaimForm({ slug, maskedSiret, isBelgian = false }: Props) {
  const [state, formAction, isPending] = useActionState(
    submitClaim,
    initialState
  );

  // Inputs controlled : préserver les valeurs au re-render après échec validation.
  const [siret, setSiret] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const passwordValid = password.length >= 8 && /\d/.test(password);

  function handleSiretInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    setSiret(isBelgian ? formatBce(raw) : formatSiret(raw));
  }

  const inputBase =
    "w-full h-12 px-4 rounded-xl border bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-250 outline-none";
  const inputNormal =
    "border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20";
  const inputError = "border-red-500 focus:ring-2 focus:ring-red-500/20";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="slug" value={slug} />

      {/* Message d'erreur global (caché pendant isPending pour pas de flash rouge) */}
      {state.message && !state.success && !isPending && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.message}
          </p>
        </div>
      )}

      {/* SIRET — reframé "confirmez" : on l'affiche masqué au-dessus, le pro le recopie */}
      <div>
        <label
          htmlFor="siret"
          className="block text-sm font-medium text-[var(--text-primary)] mb-2"
        >
          {isBelgian
            ? "Confirmez votre numéro d'entreprise (BCE)"
            : "Confirmez votre SIRET"}
        </label>
        <input
          id="siret"
          name="siret"
          type="text"
          value={siret}
          onChange={handleSiretInput}
          inputMode="numeric"
          autoComplete="off"
          placeholder={maskedSiret}
          maxLength={isBelgian ? 12 : 17}
          required
          className={`${inputBase} font-mono tracking-wide ${state.errors?.siret && !isPending ? inputError : inputNormal}`}
        />
        <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
          On l&apos;affiche au-dessus — recopiez-le, c&apos;est votre preuve d&apos;identité.
        </p>
        {state.errors?.siret && !isPending && (
          <p className="mt-1.5 text-sm text-red-500">{state.errors.siret}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-[var(--text-primary)] mb-2"
        >
          Votre email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="vous@exemple.fr"
          required
          className={`${inputBase} ${state.errors?.email && !isPending ? inputError : inputNormal}`}
        />
        {state.errors?.email && !isPending && (
          <p className="mt-1.5 text-sm text-red-500">{state.errors.email}</p>
        )}
        <p className="mt-1.5 text-xs text-[var(--text-tertiary)] leading-relaxed">
          Pour recevoir le code de vérification + vous connecter. Boîte pro qui
          filtre (OVH, Orange…)&nbsp;? Une adresse Gmail passe le mieux.
        </p>
      </div>

      {/* Mot de passe — un seul champ + œil */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-[var(--text-primary)] mb-2"
        >
          Mot de passe
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="8 caractères minimum"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputBase} pr-12 ${state.errors?.password && !isPending ? inputError : inputNormal}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200"
            tabIndex={-1}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>
        <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
          Minimum 8 caractères dont au moins 1 chiffre.
        </p>
        {state.errors?.password && !isPending && (
          <p className="mt-1.5 text-sm text-red-500">{state.errors.password}</p>
        )}
      </div>

      {/* Submit : bouton coral large + bénéfice + rassurance dessous. */}
      <button
        type="submit"
        disabled={isPending || !passwordValid}
        className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-4 rounded-full text-base font-bold transition-all duration-250 hover:scale-[1.02] disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent)]/25"
      >
        {isPending ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Vérification en cours...
          </>
        ) : (
          <>
            Recevoir mon code de validation
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </>
        )}
      </button>

      <div className="text-center space-y-2">
        <p className="text-xs text-[var(--text-tertiary)]">
          Gratuit · 2 min · sans engagement
        </p>
        <p className="text-[11px] text-[var(--text-secondary)] flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Téléphone, photos, description… à compléter juste après dans votre espace.
        </p>
      </div>
    </form>
  );
}
