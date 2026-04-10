"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { verifyClaim, type VerifyFormState } from "@/app/(public)/pro/reclamer/[slug]/actions";

type Props = {
  attemptId: string;
  slug: string;
};

const initialState: VerifyFormState = { success: false };

export default function VerificationForm({ attemptId, slug }: Props) {
  const [state, formAction, isPending] = useActionState(
    verifyClaim,
    initialState
  );
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  // Redirect on success (magic link)
  useEffect(() => {
    if (state.success && state.redirectUrl) {
      window.location.href = state.redirectUrl;
    }
  }, [state.success, state.redirectUrl]);

  function focusInput(index: number) {
    if (index >= 0 && index < 6) {
      inputRefs.current[index]?.focus();
    }
  }

  function updateDigit(index: number, value: string) {
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    // Auto-submit quand les 6 digits sont remplis
    if (newDigits.every((d) => d !== "") && formRef.current) {
      formRef.current.requestSubmit();
    }
  }

  function handleInput(index: number, e: React.FormEvent<HTMLInputElement>) {
    const value = e.currentTarget.value.replace(/\D/g, "");
    if (value.length === 0) return;

    const digit = value.slice(-1);
    updateDigit(index, digit);
    focusInput(index + 1);
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        updateDigit(index, "");
      } else if (index > 0) {
        updateDigit(index - 1, "");
        focusInput(index - 1);
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      focusInput(index - 1);
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      focusInput(index + 1);
      e.preventDefault();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;

    const newDigits = [...digits];
    for (let i = 0; i < pasted.length && i < 6; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    // Focus le prochain input vide ou le dernier
    const nextEmpty = newDigits.findIndex((d) => d === "");
    focusInput(nextEmpty === -1 ? 5 : nextEmpty);

    // Auto-submit si complet
    if (newDigits.every((d) => d !== "") && formRef.current) {
      setTimeout(() => formRef.current?.requestSubmit(), 50);
    }
  }

  const codeValue = digits.join("");

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <input type="hidden" name="attemptId" value={attemptId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="code" value={codeValue} />

      {/* Message d'erreur global */}
      {state.message && !state.success && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.message}
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          Vérification par email
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Saisissez le code à 6 chiffres envoyé à votre adresse email.
        </p>
      </div>

      {/* 6 inputs */}
      <div className="flex justify-center gap-3" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            autoFocus={i === 0}
            onInput={(e) => handleInput(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`w-12 h-14 text-center text-2xl font-mono font-bold rounded-xl border bg-[var(--bg-primary)] text-[var(--text-primary)] transition-all duration-250 outline-none ${
              state.errors?.code
                ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            }`}
            aria-label={`Chiffre ${i + 1}`}
          />
        ))}
      </div>

      {/* Erreur code */}
      {state.errors?.code && (
        <p className="text-sm text-red-500 text-center">{state.errors.code}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || codeValue.length < 6}
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
            Vérification...
          </>
        ) : (
          "Vérifier le code"
        )}
      </button>

      <p className="text-xs text-[var(--text-tertiary)] text-center">
        Le code est valable 15 minutes. Vous disposez de 3 tentatives.
      </p>
    </form>
  );
}
