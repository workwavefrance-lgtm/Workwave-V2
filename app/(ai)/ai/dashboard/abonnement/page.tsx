import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAiProByUserId } from "@/lib/queries/pros";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";

/**
 * Page "Facturation" du dashboard freelance (pay-per-lead).
 *
 * Depuis le 28/06/2026 : plus d'abonnement Premium 29,90 €/mois. Le freelance
 * paie 9,90 € pour débloquer UN projet (table lead_unlocks). Cette page affiche
 * l'historique de ses déblocages + le total dépensé. (L'ancien `actions.ts`
 * Stripe Customer Portal / checkout abonnement est désormais code mort.)
 */
export const metadata: Metadata = {
  title: "Facturation — Dashboard Workwave",
  description: "Vos déblocages de projets (pay-per-lead 9,90 €).",
  robots: { index: false, follow: false },
};

type UnlockRow = {
  id: number;
  project_id: number;
  amount_cents: number;
  currency: string;
  paid_at: string;
  projects:
    | { description: string | null }
    | { description: string | null }[]
    | null;
};

function projectTitle(u: UnlockRow): string {
  const p = Array.isArray(u.projects) ? u.projects[0] : u.projects;
  const desc = (p?.description || "").split(/\n\n+/)[0].trim();
  return desc ? desc.slice(0, 80) : `Projet #${u.project_id}`;
}

function euros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 });
}

export default async function AiDashboardFacturationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const pro = await getAiProByUserId(user.id);
  if (!pro || !AI_CATEGORY_IDS.includes(pro.category_id)) return null;

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: unlocksRaw } = await service
    .from("lead_unlocks")
    .select("id, project_id, amount_cents, currency, paid_at, projects(description)")
    .eq("pro_id", pro.id)
    .order("paid_at", { ascending: false });

  const unlocks = (unlocksRaw || []) as UnlockRow[];
  const totalCents = unlocks.reduce((s, u) => s + (u.amount_cents || 0), 0);

  return (
    <div className="max-w-3xl">
      <div className="mb-10">
        <p
          className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          [ DASHBOARD · FACTURATION ]
        </p>
        <h1
          className="font-black text-[var(--ai-text)] uppercase mb-3"
          style={{ fontSize: "clamp(28px, 4.5vw, 48px)", lineHeight: 0.95, letterSpacing: "-0.04em" }}
        >
          Facturation.
        </h1>
        <p className="text-base text-[var(--ai-text-secondary)] leading-relaxed">
          Pas d&apos;abonnement, pas d&apos;engagement. Vous payez{" "}
          <strong className="text-[var(--ai-text)]">9,90 € seulement pour débloquer</strong>{" "}
          un projet qui vous intéresse — et vous voyez le projet avant de payer.
        </p>
      </div>

      {/* Récap */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className="p-6 bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl">
          <p
            className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
            style={{ letterSpacing: "0.18em" }}
          >
            Projets débloqués
          </p>
          <p className="text-3xl font-black text-[var(--ai-text)]">{unlocks.length}</p>
        </div>
        <div className="p-6 bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl">
          <p
            className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
            style={{ letterSpacing: "0.18em" }}
          >
            Total dépensé
          </p>
          <p className="text-3xl font-black text-[var(--ai-text)]">{euros(totalCents)} €</p>
        </div>
      </div>

      {/* Historique */}
      {unlocks.length === 0 ? (
        <div className="text-center py-16 bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl">
          <h2 className="text-[20px] font-bold text-[var(--ai-text)] mb-2">
            Aucun déblocage pour l&apos;instant
          </h2>
          <p className="text-[14px] text-[var(--ai-text-secondary)] mb-6 max-w-md mx-auto leading-relaxed">
            Parcourez les projets de votre domaine et débloquez ceux qui vous
            intéressent pour 9,90 €.
          </p>
          <Link
            href="/ai/dashboard/projets"
            className="inline-flex items-center justify-center h-11 px-6 text-[13px] font-semibold rounded-full bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
          >
            Voir les projets
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {unlocks.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between gap-4 p-4 bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-xl"
            >
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-[var(--ai-text)] truncate">
                  {projectTitle(u)}
                </p>
                <p className="text-[12px] text-[var(--ai-text-tertiary)]">
                  {new Date(u.paid_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span className="text-[14px] font-semibold text-[var(--ai-text)] shrink-0">
                {euros(u.amount_cents || 0)} €
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-12 pt-8 border-t border-[var(--ai-border-subtle)]">
        <p className="text-[13px] text-[var(--ai-text-tertiary)]">
          Un reçu de paiement vous est envoyé par email après chaque déblocage
          (Stripe). Une question ?{" "}
          <a
            href="mailto:contact@workwave.fr"
            className="underline hover:text-[var(--ai-accent)]"
          >
            contact@workwave.fr
          </a>
          .
        </p>
      </div>
    </div>
  );
}
