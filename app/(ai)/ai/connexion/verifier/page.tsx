import type { Metadata } from "next";
import Link from "next/link";
import { Watermark } from "@/components/ai/ui/Watermark";
import { verifyCode } from "./actions";

export const metadata: Metadata = {
  title: "Code de connexion — Workwave AI",
  description: "Saisissez le code envoye par email pour vous connecter a votre espace Workwave AI.",
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Code manquant. Reessayez.",
  invalid_code: "Code incorrect. Il vous reste des essais.",
  expired: "Code expire (15 min). Demandez un nouveau code.",
  blocked: "Trop de tentatives. Demandez un nouveau code dans quelques minutes.",
  no_attempt: "Aucune demande active. Renvoyez votre email pour recevoir un nouveau code.",
  signin_failed: "Erreur de connexion. Reessayez.",
};

export default async function ConnexionVerifierPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; maybe?: string }>;
}) {
  const sp = await searchParams;
  const email = sp.email || "";
  const error = sp.error || "";
  const maybe = sp.maybe === "1"; // anti-enumeration mode

  // Obfusquer l'email pour affichage (anti-shoulder-surfing)
  const obfuscated = email
    ? email.replace(/^(.)(.*)(@.*)$/, (_, first, mid, end) => {
        return first + "*".repeat(Math.min(mid.length, 6)) + end;
      })
    : "votre email";

  const errorMsg = error ? ERROR_MESSAGES[error] || "Erreur. Reessayez." : "";

  return (
    <section className="relative overflow-hidden min-h-[calc(100vh-64px)] flex items-center">
      <Watermark text="VERIFIER" position="bottom" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 w-full">
        <div className="max-w-md mx-auto">
          {/* Logo grid 2x2 */}
          <Link
            href="/ai"
            className="inline-flex items-center gap-2.5 mb-12 group"
            aria-label="Workwave AI"
          >
            <div
              className="grid grid-cols-2 grid-rows-2 gap-[2px] w-8 h-8 transition-transform duration-200 group-hover:rotate-90"
              aria-hidden="true"
            >
              <div className="bg-[var(--ai-accent)] rounded-[2px]" />
              <div className="bg-[var(--ai-text)] rounded-[2px]" />
              <div className="bg-[var(--ai-text)] rounded-[2px]" />
              <div className="bg-[var(--ai-accent)] rounded-[2px]" />
            </div>
            <span className="text-[16px] font-semibold text-[var(--ai-text)] tracking-tight">
              Workwave{" "}
              <span className="font-medium text-[var(--ai-text-tertiary)]">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-4 mb-8">
            <span
              className="text-[11px] font-medium tracking-[0.2em] text-[var(--ai-text-tertiary)]"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              [ CODE DE CONNEXION ]
            </span>
            <span className="h-px flex-1 max-w-[40px] bg-[var(--ai-border)]" />
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-accent)]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
              15 min
            </span>
          </div>

          <h1
            className="font-black text-[var(--ai-text)] uppercase mb-6"
            style={{
              fontSize: "clamp(32px, 6vw, 56px)",
              lineHeight: 0.95,
              letterSpacing: "-0.05em",
            }}
          >
            Code envoye.
          </h1>
          <p className="text-base text-[var(--ai-text-secondary)] leading-relaxed mb-2">
            {maybe ? (
              <>Si un compte Workwave AI existe pour cet email, vous avez recu un code a 6 chiffres.</>
            ) : (
              <>Nous avons envoye un code a 6 chiffres a <strong className="text-[var(--ai-text)]">{obfuscated}</strong>.</>
            )}
          </p>
          <p className="text-sm text-[var(--ai-text-tertiary)] mb-8">
            Verifiez vos spams si rien sous 2 minutes. Email envoye depuis{" "}
            <code className="text-[12px] px-1 py-0.5 rounded bg-[var(--ai-bg-subtle)] text-[var(--ai-text)]">
              contact@workwave.fr
            </code>
          </p>

          {errorMsg && (
            <div
              className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-700"
              role="alert"
            >
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          <form className="space-y-5" action={verifyCode}>
            <input type="hidden" name="email" value={email} />

            <div>
              <label
                htmlFor="code"
                className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                style={{
                  letterSpacing: "0.18em",
                  fontFamily: "var(--font-geist-mono), monospace",
                }}
              >
                Code a 6 chiffres
              </label>
              <input
                id="code"
                type="text"
                name="code"
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="123456"
                className="w-full h-14 px-4 text-[24px] font-bold tracking-[0.3em] text-center text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 px-6 text-[14px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors flex items-center justify-center"
            >
              Se connecter
              <svg
                className="ml-2 w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>

          {/* Renvoyer un nouveau code */}
          <div className="mt-10 pt-8 border-t border-[var(--ai-border-subtle)] text-center">
            <p className="text-sm text-[var(--ai-text-secondary)] mb-3">
              Pas recu de code ?
            </p>
            <Link
              href={`/ai/connexion${email ? `?prefill=${encodeURIComponent(email)}` : ""}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ai-text)] hover:text-[var(--ai-accent)] transition-colors"
            >
              Renvoyer un nouveau code
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>

          {/* Fallback support */}
          <p className="text-[11px] text-[var(--ai-text-tertiary)] text-center mt-10 leading-relaxed">
            Un probleme ? Ecrivez-nous a{" "}
            <a
              href="mailto:contact@workwave.fr"
              className="text-[var(--ai-text)] underline decoration-[var(--ai-border)] underline-offset-2"
            >
              contact@workwave.fr
            </a>
            . Reponse sous 48h ouvrees.
          </p>
        </div>
      </div>
    </section>
  );
}
