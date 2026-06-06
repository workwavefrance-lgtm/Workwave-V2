"use client";

import { useEffect, useRef, useState } from "react";
import ProjectForm from "@/components/project/ProjectForm";

type Category = { id: number; name: string; vertical: string };

/**
 * Bouton CTA qui ouvre une MODAL avec le ProjectForm complet.
 * Embed direct du form sans redirect vers /deposer-projet → +UX, +conversion.
 *
 * Comportement :
 * - Bouton intégrable n'importe où (header, footer, hero…) via la prop `className`
 *   et `label` (texte du bouton).
 * - Au 1er clic : fetch les catégories depuis /api/public/categories (cache 1h).
 * - Modal native <dialog> = ESC + backdrop click ferment automatiquement.
 * - Au submit réussi, le ProjectForm gère lui-même le redirect via redirect()
 *   du Server Action → la modal disparaît avec la page.
 */
export default function QuickProjectModalTrigger({
  className,
  label = "Déposer mon projet",
}: {
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Synchronise état React ↔ état natif du <dialog>
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Fetch categories à l'ouverture (1 fois)
  async function openModal() {
    if (!categories && !loading) {
      setLoading(true);
      try {
        const r = await fetch("/api/public/categories");
        if (r.ok) setCategories(await r.json());
      } finally {
        setLoading(false);
      }
    }
    setOpen(true);
  }

  function onBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={
          className ||
          "inline-flex items-center gap-2 rounded-full bg-[#FF5A36] hover:bg-[#E63E1A] text-white font-semibold px-5 py-2.5 text-sm transition-colors duration-200"
        }
      >
        {label}
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={onBackdropClick}
        className="m-auto rounded-2xl border border-[var(--card-border)] bg-[var(--bg-primary)] p-0 max-w-2xl w-[calc(100%-2rem)] max-h-[90vh] overflow-hidden shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        {open && (
          <div className="flex flex-col max-h-[90vh]">
            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--card-border)]">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                Décrivez votre projet
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading && (
                <p className="text-center text-[var(--text-secondary)] py-8">
                  Chargement…
                </p>
              )}
              {categories && (
                <ProjectForm categories={categories} />
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
