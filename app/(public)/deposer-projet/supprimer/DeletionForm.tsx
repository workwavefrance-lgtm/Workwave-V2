"use client";

import { useActionState } from "react";
import { deleteProject, type DeleteState } from "./actions";

export default function DeletionForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState<DeleteState, FormData>(
    deleteProject,
    { success: false }
  );

  if (state.success) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">
          Demande supprimée
        </h2>
        <p className="text-sm text-green-700 dark:text-green-400">
          Votre demande a été supprimée avec succès. Les professionnels concernés
          ont été informés du retrait.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />

      {state.message && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.message}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-full transition-colors duration-250 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Suppression en cours..." : "Confirmer la suppression"}
      </button>
    </form>
  );
}
