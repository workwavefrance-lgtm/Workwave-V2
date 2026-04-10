"use client";

import { useActionState } from "react";
import { submitDeletionRequest, type DeletionRequestState } from "./actions";

export default function DeletionRequestForm({
  slug,
  hasSiret,
}: {
  slug: string;
  hasSiret: boolean;
}) {
  const [state, formAction, isPending] = useActionState<
    DeletionRequestState,
    FormData
  >(submitDeletionRequest, { success: false });

  if (!hasSiret) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6">
        <p className="text-[var(--text-secondary)] text-sm mb-4">
          Cette fiche ne dispose pas de SIRET enregistré. La suppression
          automatique n&apos;est pas disponible.
        </p>
        <a
          href="mailto:contact@workwave.fr"
          className="text-[var(--accent)] font-semibold text-sm hover:underline"
        >
          Contacter le support pour demander la suppression
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="slug" value={slug} />

      {state.message && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.message}
          </p>
        </div>
      )}

      <div>
        <label
          htmlFor="siret"
          className="block text-sm font-medium text-[var(--text-primary)] mb-2"
        >
          SIRET de l&apos;entreprise
        </label>
        <input
          id="siret"
          name="siret"
          type="text"
          inputMode="numeric"
          maxLength={14}
          placeholder="12345678901234"
          className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
        {state.errors?.siret && (
          <p className="text-xs text-red-500 mt-1">{state.errors.siret}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-[var(--text-primary)] mb-2"
        >
          Adresse email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="contact@entreprise.fr"
          className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
        {state.errors?.email && (
          <p className="text-xs text-red-500 mt-1">{state.errors.email}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-full transition-colors duration-250 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Envoi en cours..." : "Envoyer le code de vérification"}
      </button>
    </form>
  );
}
