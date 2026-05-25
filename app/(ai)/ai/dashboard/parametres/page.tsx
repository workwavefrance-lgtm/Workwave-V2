import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAiProByUserId } from "@/lib/queries/pros";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";

export const metadata: Metadata = {
  title: "Parametres — Dashboard Workwave AI",
  description: "Parametres de votre compte Workwave AI.",
  robots: { index: false, follow: false },
};

export default async function AiDashboardParametresPage() {
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
                : "Tech"}
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

      {/* Suppression compte */}
      <div className="mt-12 pt-8 border-t border-[var(--ai-border-subtle)]">
        <p
          className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          Zone sensible
        </p>
        <p className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed">
          Pour supprimer definitivement votre compte et toutes vos donnees,
          ecrivez-nous a{" "}
          <a
            href="mailto:contact@workwave.fr?subject=Suppression%20compte%20Workwave%20AI"
            className="text-[var(--ai-accent)] underline decoration-[var(--ai-border)] hover:text-[var(--ai-accent-hover)]"
          >
            contact@workwave.fr
          </a>{" "}
          en mentionnant votre ID compte (#{pro.id}). Reponse sous 48h ouvrees,
          suppression effective sous 7 jours (RGPD art. 17).
        </p>
      </div>
    </div>
  );
}
