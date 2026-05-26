"use client";

import { useFormStatus } from "react-dom";

/**
 * Bouton submit avec etat loading automatique via useFormStatus().
 *
 * Resout le probleme UX : sans feedback visuel au clic, l'user clique
 * plusieurs fois en pensant que ca n'a pas marche.
 *
 * Le bouton se met automatiquement en disabled + affiche un spinner
 * pendant que le Server Action est en cours d'execution.
 *
 * Usage :
 *   <form action={myAction}>
 *     <SubmitButton>Envoyer</SubmitButton>
 *   </form>
 *
 * Le composant DOIT etre rendu a l'interieur d'un <form>. Sinon
 * useFormStatus() retourne { pending: false } et le loading state
 * ne se declenche jamais.
 */
export default function SubmitButton({
  children,
  className,
  pendingText,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type" | "disabled">) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className || ""} ${
        pending ? "opacity-70 cursor-wait" : "cursor-pointer"
      } transition-opacity`}
      {...rest}
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Spinner />
          {pendingText || "En cours…"}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
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
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
