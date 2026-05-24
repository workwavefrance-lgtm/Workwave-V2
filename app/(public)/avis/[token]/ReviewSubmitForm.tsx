"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitReviewAction } from "./actions";

/**
 * Formulaire de notation interactif :
 * - 5 etoiles cliquables (avec hover preview)
 * - Textarea optionnelle pour commenter
 * - Bouton submit avec etat loading
 * - Page de succes apres submit (state local, pas de redirect)
 *
 * Design premium : etoiles en SVG, animation au hover/click, palette
 * coral coherente avec le reste du site.
 */
export default function ReviewSubmitForm({
  token,
  proName,
}: {
  token: string;
  proName: string;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Veuillez sélectionner une note avant de valider.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitReviewAction(token, rating, comment);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSubmitted(true);
    });
  }

  // ─── Page de succes apres submit ───────────────────────────────────────
  if (submitted) {
    return (
      <div className="text-center py-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
          style={{
            background:
              "linear-gradient(135deg, #FF7A5C 0%, #FF5A36 60%, #D63916 100%)",
            boxShadow: "0 8px 24px -8px rgba(255, 90, 54, 0.45)",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
          Merci pour votre avis !
        </h2>
        <p className="text-[var(--text-secondary)] mb-2 max-w-md mx-auto">
          {rating >= 3
            ? "Votre avis vient d'être publié et apparaît dès maintenant sur la fiche de l'artisan."
            : "Votre avis a bien été enregistré. Notre équipe le vérifiera dans les 24h avant publication."}
        </p>
        <p className="text-[13px] text-[var(--text-tertiary)] mb-8 max-w-md mx-auto">
          Vous aidez d'autres particuliers à faire le bon choix. C'est précieux pour notre communauté.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[14px] font-semibold transition-all duration-200 hover:scale-105"
          style={{ boxShadow: "0 4px 12px -2px rgba(255, 90, 54, 0.4)" }}
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  // ─── Formulaire de notation ────────────────────────────────────────────
  const ratingLabels: Record<number, string> = {
    1: "Très décevant",
    2: "Décevant",
    3: "Correct",
    4: "Bien",
    5: "Excellent",
  };

  const displayRating = hoverRating || rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Question principale */}
      <div className="text-center">
        <p className="text-[15px] text-[var(--text-secondary)] mb-2">
          Comment évaluez-vous la prestation de
        </p>
        <p className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          {proName}
        </p>
        <p className="text-[13px] text-[var(--text-tertiary)] mt-2">
          ?
        </p>
      </div>

      {/* Etoiles cliquables */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="flex gap-2"
          role="radiogroup"
          aria-label="Note sur 5 étoiles"
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const isActive = star <= displayRating;
            return (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={rating === star}
                aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => {
                  setRating(star);
                  setError(null);
                }}
                className="p-1 transition-transform duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 rounded"
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill={isActive ? "#FF5A36" : "none"}
                  stroke={isActive ? "#FF5A36" : "#D1D5DB"}
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="transition-all duration-150"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            );
          })}
        </div>
        <p
          className="text-[14px] font-medium h-5 transition-colors duration-200"
          style={{
            color: displayRating > 0 ? "var(--accent)" : "transparent",
          }}
        >
          {displayRating > 0 ? ratingLabels[displayRating] : "—"}
        </p>
      </div>

      {/* Commentaire optionnel */}
      <div>
        <label
          htmlFor="comment"
          className="block text-[14px] font-medium text-[var(--text-primary)] mb-2"
        >
          Souhaitez-vous laisser un commentaire ?
          <span className="text-[var(--text-tertiary)] font-normal ml-1">
            (optionnel)
          </span>
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Décrivez votre expérience : qualité du travail, ponctualité, communication, prix…"
          rows={5}
          maxLength={2000}
          className="w-full px-4 py-3 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-primary)] text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all duration-200 resize-none"
        />
        <p className="text-[11px] text-[var(--text-tertiary)] mt-1 text-right">
          {comment.length} / 2000
        </p>
      </div>

      {/* Erreur eventuelle */}
      {error && (
        <div
          className="text-[13px] text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Boutton submit */}
      <button
        type="submit"
        disabled={pending || rating === 0}
        className="w-full h-12 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[15px] font-semibold transition-all duration-200 hover:scale-[1.01] disabled:hover:scale-100 flex items-center justify-center gap-2"
        style={
          !pending && rating > 0
            ? { boxShadow: "0 4px 14px -2px rgba(255, 90, 54, 0.45)" }
            : {}
        }
      >
        {pending ? (
          <>
            <svg
              className="animate-spin"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
            </svg>
            Envoi en cours…
          </>
        ) : (
          "Publier mon avis"
        )}
      </button>

      <p className="text-[11px] text-[var(--text-tertiary)] text-center leading-relaxed">
        Votre avis est confidentiel. Seuls votre prénom et la première lettre de votre nom seront affichés publiquement.
        Les avis avec moins de 3 étoiles sont vérifiés par notre équipe avant publication (24h).
      </p>
    </form>
  );
}
