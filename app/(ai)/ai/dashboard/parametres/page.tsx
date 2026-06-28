import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAiProByUserId } from "@/lib/queries/pros";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";
import SubmitButton from "@/components/ai/SubmitButton";
import { deleteAiAccount } from "./actions";

export const metadata: Metadata = {
  title: "Parametres — Dashboard Workwave AI",
  description: "Parametres de votre compte Workwave AI.",
  robots: { index: false, follow: false },
};

const PARAM_ERROR_MESSAGES: Record<string, string> = {
  confirm_required:
    "Vous devez taper SUPPRIMER en majuscules pour confirmer la suppression.",
  no_pro: "Compte introuvable. Reconnectez-vous.",
};

export default async function AiDashboardParametresPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const errKey = sp.error;
  const errorMsg = errKey && PARAM_ERROR_MESSAGES[errKey] ? PARAM_ERROR_MESSAGES[errKey] : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const pro = await getAiProByUserId(user.id);
  if (!pro || !AI_CATEGORY_IDS.includes(pro.category_id)) return null;

  return (
    <div className="max-w-3xl">
      <div className="mb-10">
        <p
          className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          [ DASHBOARD · PARAMETRES ]
        </p>
        <h1
          className="font-black text-[var(--ai-text)] uppercase mb-3"
          style={{
            fontSize: "clamp(28px, 4.5vw, 48px)",
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
          }}
        >
          Parametres.
        </h1>
      </div>

      {errorMsg && (
        <div
          className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-800"
          role="alert"
        >
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Email */}
      <div className="mb-6 p-6 bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl">
        <p
          className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          Email de connexion
        </p>
        <p className="text-[15px] text-[var(--ai-text)] font-medium">{user.email}</p>
        <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-2">
          Pour changer d&apos;email, ecrivez-nous a{" "}
          <a
            href="mailto:contact@workwave.fr"
            className="underline decoration-[var(--ai-border)] hover:text-[var(--ai-accent)]"
          >
            contact@workwave.fr
          </a>
          .
        </p>
      </div>

      {/* Compte (SIRET, ID, etc.) */}
      <div className="mb-6 p-6 bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl">
        <p
          className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          Compte
        </p>
        <dl className="space-y-2 text-[13px]">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--ai-text-tertiary)]">ID compte</dt>
            <dd
              className="text-[var(--ai-text)] font-mono"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              #{pro.id}
            </dd>
          </div>
          {pro.siret && (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ai-text-tertiary)]">SIRET</dt>
              <dd
                className="text-[var(--ai-text)] font-mono"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                {pro.siret}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--ai-text-tertiary)]">Categorie</dt>
            <dd className="text-[var(--ai-text)]">
              {pro.category && typeof pro.category === "object" && "name" in pro.category
                ? (pro.category as { name: string }).name
                : "Workwave AI"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Liens utiles */}
      <div className="space-y-3 mb-10">
        <Link
          href={pro.slug ? `/ai/freelance/${pro.slug}` : "/ai/freelances"}
          className="block p-4 bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-xl hover:border-[var(--ai-text)] transition-colors"
        >
          <p className="text-[14px] font-semibold text-[var(--ai-text)]">
            Voir ma fiche publique
          </p>
          <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-1">
            Comment les clients voient votre profil sur Workwave AI.
          </p>
        </Link>
      </div>

      {/* Deconnexion */}
      <div className="pt-6 border-t border-[var(--ai-border-subtle)]">
        <Link
          href="/api/auth/signout?redirect=/ai"
          prefetch={false}
          className="inline-flex items-center justify-center h-11 px-5 text-[13px] font-semibold rounded-lg bg-[var(--ai-secondary)] hover:bg-[var(--ai-secondary-hover)] text-[var(--ai-secondary-text)] border border-[var(--ai-secondary-border)] transition-colors"
        >
          Se deconnecter
        </Link>
      </div>

      {/* Suppression compte — RGPD self-service */}
      <div className="mt-12 pt-8 border-t border-[var(--ai-border-subtle)]">
        <p
          className="text-[10px] uppercase font-semibold text-red-700 mb-3"
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          Zone sensible — Suppression du compte
        </p>

        <div className="p-6 bg-red-50/40 border border-red-200 rounded-2xl">
          <h2 className="text-[18px] font-bold text-[var(--ai-text)] mb-2">
            Supprimer mon compte Workwave AI
          </h2>
          <p className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed mb-4">
            Action <strong className="text-red-700">irreversible</strong>.
            Effets immediats :
          </p>
          <ul className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed mb-4 list-disc list-inside space-y-1">
            <li>Suppression de votre fiche publique sur Workwave AI</li>
            <li>
              Nullification de vos coordonnees (email, telephone, site web,
              reseaux sociaux)
            </li>
            <li>Plus aucun email de projet ne vous sera envoye</li>
            <li>Vous serez deconnecte immediatement apres la suppression</li>
          </ul>
          <p className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed mb-4">
            Pour confirmer, tapez{" "}
            <strong className="text-red-700 font-mono">SUPPRIMER</strong> en
            majuscules dans le champ ci-dessous.
          </p>

          <form action={deleteAiAccount} className="space-y-3">
            <input
              type="text"
              name="confirm"
              required
              placeholder="Tapez SUPPRIMER pour confirmer"
              autoComplete="off"
              className="w-full h-11 px-4 text-[14px] font-mono border border-red-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            />
            <SubmitButton
              pendingText="Suppression en cours…"
              className="inline-flex items-center justify-center h-11 px-5 text-[13px] font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Supprimer definitivement mon compte
            </SubmitButton>
          </form>
        </div>

        <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-4 leading-relaxed">
          En cas de souci, ecrivez-nous a{" "}
          <a
            href="mailto:contact@workwave.fr?subject=Suppression%20compte%20Workwave%20AI"
            className="underline decoration-[var(--ai-border)] hover:text-[var(--ai-accent)]"
          >
            contact@workwave.fr
          </a>{" "}
          en mentionnant votre ID compte (#{pro.id}).
        </p>
      </div>
    </div>
  );
}
