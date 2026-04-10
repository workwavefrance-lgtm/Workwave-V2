"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/components/pro/dashboard/DashboardProvider";
import { createClient } from "@/lib/supabase/client";

export default function ParametresView() {
  const { user } = useDashboard();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notifications, setNotifications] = useState(true);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          Paramètres
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Gérez votre compte et vos notifications
        </p>
      </div>

      <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl divide-y divide-[var(--border-color)]">
        {/* Email */}
        <div className="p-6">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
            Email de connexion
          </p>
          <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-2">
            La modification de l&apos;email sera disponible prochainement.
          </p>
        </div>

        {/* Notifications */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                Notifications par email
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                Recevez un email à chaque nouveau lead
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifications}
              onClick={() => setNotifications(!notifications)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
                notifications ? "bg-[var(--accent)]" : "bg-[var(--bg-tertiary)]"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  notifications ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Déconnexion */}
        <div className="p-6">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-3">
            Session
          </p>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-60"
          >
            {signingOut ? "Déconnexion..." : "Se déconnecter"}
          </button>
        </div>
      </div>

      {/* Zone danger */}
      <div className="border border-red-200 dark:border-red-900 rounded-2xl p-6">
        <p className="text-sm font-medium text-red-500 mb-1">
          Supprimer mon compte
        </p>
        <p className="text-sm text-[var(--text-tertiary)] mb-4">
          Cette action est irréversible. Votre fiche restera visible dans
          l&apos;annuaire mais ne sera plus liée à votre compte.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="text-sm font-medium text-red-500 hover:text-red-600 hover:underline transition-colors duration-200"
        >
          Supprimer mon compte
        </button>
      </div>

      {/* Modale suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-2xl p-8 max-w-md w-full shadow-xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Supprimer votre compte ?
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Cette action est irréversible. Votre fiche restera visible dans
                l&apos;annuaire mais ne sera plus liée à votre compte. Si vous
                avez un abonnement actif, il sera résilié.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 border border-[var(--border-color)] text-[var(--text-primary)] px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-[var(--bg-tertiary)]"
              >
                Annuler
              </button>
              <a
                href="mailto:support@workwave.fr?subject=Suppression de mon compte professionnel"
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-xl text-sm font-semibold text-center transition-all duration-200"
              >
                Contacter le support
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
