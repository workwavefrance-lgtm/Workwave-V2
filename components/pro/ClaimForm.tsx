"use client";

import { useActionState } from "react";
import { submitClaim, type ClaimFormState } from "@/app/(public)/pro/reclamer/[slug]/actions";

type Props = {
  slug: string;
  proName: string;
};

const initialState: ClaimFormState = { success: false };

function formatSiret(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
}

export default function ClaimForm({ slug, proName }: Props) {
  const [state, formAction, isPending] = useActionState(
    submitClaim,
    initialState
  );

  function handleSiretInput(e: React.FormEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const raw = input.value.replace(/\D/g, "");
    input.value = formatSiret(raw);
  }

  const inputBase =
    "w-full h-12 px-4 rounded-xl border bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-250 outline-none";
  const inputNormal =
    "border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20";
  const inputError = "border-red-500 focus:ring-2 focus:ring-red-500/20";

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="slug" value={slug} />

      {/* Message d'erreur global */}
      {state.message && !state.success && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.message}
          </p>
        </div>
      )}

      {/* En-tête */}
      <div className="text-center pb-2">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
          Réclamer la fiche
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          <span className="font-medium text-[var(--text-primary)]">{proName}</span>
        </p>
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-[var(--text-primary)] mb-2"
        >
          Email professionnel
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="contact@entreprise.fr"
          required
          className={`${inputBase} ${state.errors?.email ? inputError : inputNormal}`}
        />
        {state.errors?.email && (
          <p className="mt-1.5 text-sm text-red-500">{state.errors.email}</p>
        )}
      </div>

      {/* SIRET */}
      <div>
        <label
          htmlFor="siret"
          className="block text-sm font-medium text-[var(--text-primary)] mb-2"
        >
          Numéro SIRET
        </label>
        <input
          id="siret"
          name="siret"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="123 456 789 01234"
          maxLength={17}
          required
          onInput={handleSiretInput}
          className={`${inputBase} font-mono tracking-wide ${state.errors?.siret ? inputError : inputNormal}`}
        />
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
          14 chiffres, visible sur vos documents officiels
        </p>
        {state.errors?.siret && (
          <p className="mt-1.5 text-sm text-red-500">{state.errors.siret}</p>
        )}
      </div>

      {/* Nom du gérant */}
      <div>
        <label
          htmlFor="managerName"
          className="block text-sm font-medium text-[var(--text-primary)] mb-2"
        >
          Nom du gérant
        </label>
        <input
          id="managerName"
          name="managerName"
          type="text"
          autoComplete="name"
          placeholder="Jean Dupont"
          required
          className={`${inputBase} ${state.errors?.managerName ? inputError : inputNormal}`}
        />
        {state.errors?.managerName && (
          <p className="mt-1.5 text-sm text-red-500">
            {state.errors.managerName}
          </p>
        )}
      </div>

      {/* Téléphone */}
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-[var(--text-primary)] mb-2"
        >
          Téléphone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="06 12 34 56 78"
          required
          className={`${inputBase} ${state.errors?.phone ? inputError : inputNormal}`}
        />
        {state.errors?.phone && (
          <p className="mt-1.5 text-sm text-red-500">{state.errors.phone}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
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
          "Vérifier et envoyer le code"
        )}
      </button>

      <p className="text-xs text-[var(--text-tertiary)] text-center">
        Un code de vérification à 6 chiffres sera envoyé à votre adresse email.
      </p>
    </form>
  );
}
