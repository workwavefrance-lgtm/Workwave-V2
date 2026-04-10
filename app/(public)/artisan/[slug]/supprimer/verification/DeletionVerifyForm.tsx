"use client";

import { useActionState } from "react";
import { verifyDeletion, type DeletionVerifyState } from "../actions";

export default function DeletionVerifyForm({
  slug,
  attemptId,
}: {
  slug: string;
  attemptId: string;
}) {
  const [state, formAction, isPending] = useActionState<
    DeletionVerifyState,
    FormData
  >(verifyDeletion, { success: false });

  if (state.success) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">
          Fiche supprimée
        </h2>
        <p className="text-sm text-green-700 dark:text-green-400">
          La fiche a été désactivée. Elle ne sera plus visible dans l&apos;annuaire
          sous 48 heures. Si vous aviez un abonnement actif, il a été résilié.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="attemptId" value={attemptId} />
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
          htmlFor="code"
          className="block text-sm font-medium text-[var(--text-primary)] mb-2"
        >
          Code de vérification
        </label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          autoFocus
          className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
        {state.errors?.code && (
          <p className="text-xs text-red-500 mt-1">{state.errors.code}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-full transition-colors duration-250 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Vérification..." : "Confirmer la suppression"}
      </button>
    </form>
  );
}
