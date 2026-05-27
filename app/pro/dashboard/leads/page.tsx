import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBtpProByUserId } from "@/lib/queries/pros";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { startBtpUnlock } from "./actions";
import SubmitButton from "@/components/ai/SubmitButton";

export const metadata: Metadata = {
  title: "Leads reçus — Workwave Pro",
  description:
    "Tous les projets de votre zone (catégorie + département). Débloquez les coordonnées pour 9,90€ TTC par projet.",
  robots: { index: false, follow: false },
};

const BUDGET_LABELS: Record<string, string> = {
  lt500: "< 500 €",
  "500_2000": "500 - 2 000 €",
  "2000_5000": "2 000 - 5 000 €",
  "5000_15000": "5 000 - 15 000 €",
  gt15000: "> 15 000 €",
  unknown: "À définir",
};

const URGENCY_LABELS: Record<string, string> = {
  today: "Aujourd'hui",
  this_week: "Cette semaine",
  this_month: "Ce mois-ci",
  not_urgent: "Pas urgent",
};

const PROJECTS_LIMIT = 50;

const PARAM_ERRORS: Record<string, string> = {
  invalid_project: "Lien projet invalide.",
  no_pro: "Compte introuvable. Reconnectez-vous.",
  paused: "Votre fiche est en pause. Réactivez-la dans Préférences.",
  project_not_found: "Projet introuvable.",
  not_btp_project: "Ce projet n'est pas un projet BTP.",
  project_deleted: "Ce projet a été supprimé par le particulier.",
  stripe_not_configured: "Service de paiement temporairement indisponible.",
  checkout_failed: "Erreur Stripe Checkout. Réessayez.",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    unlocked?: string;
    canceled?: string;
    already_unlocked?: string;
    error?: string;
  }>;
}) {
  const sp = await searchParams;
  const unlockedId = sp.unlocked ? parseInt(sp.unlocked, 10) : null;
  const canceledId = sp.canceled ? parseInt(sp.canceled, 10) : null;
  const alreadyUnlockedId = sp.already_unlocked
    ? parseInt(sp.already_unlocked, 10)
    : null;
  const errorMsg = sp.error ? PARAM_ERRORS[sp.error] || "Erreur. Réessayez." : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/pro/connexion");

  const pro = await getBtpProByUserId(user.id);
  if (!pro) redirect("/pro/reclamer");

  // Récupérer le département du pro (via cities.department_id)
  const proDeptId = pro.city?.department_id;
  if (!proDeptId) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            Leads reçus
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Votre fiche n&apos;a pas de ville renseignée. Veuillez compléter
            votre profil pour recevoir des projets de votre zone.
          </p>
        </div>
        <Link
          href="/pro/dashboard/fiche"
          className="inline-flex items-center justify-center h-11 px-5 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white"
        >
          Compléter ma fiche →
        </Link>
      </div>
    );
  }

  // Charger toutes les villes du département du pro
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: cities } = await service
    .from("cities")
    .select("id")
    .eq("department_id", proDeptId);
  const cityIds = (cities || []).map((c: { id: number }) => c.id);

  // Charger tous les projets BTP eligibles (meme catégorie + même département)
  let projects: ProjectRow[] = [];
  if (cityIds.length > 0) {
    const { data: projectsRaw } = await service
      .from("projects")
      .select(
        "id, description, budget, urgency, status, created_at, ai_qualification, first_name, email, phone, category_id, cleaned_description, has_contact_in_description, cities(name)"
      )
      .eq("vertical", "btp")
      .eq("category_id", pro.category_id)
      .in("city_id", cityIds)
      .neq("status", "deleted")
      .order("created_at", { ascending: false })
      .limit(PROJECTS_LIMIT);
    projects = (projectsRaw || []) as unknown as ProjectRow[];
  }

  // Charger les unlocks existants du pro pour savoir lesquels sont deja debloqués
  const projectIds = projects.map((p) => p.id);
  const { data: unlocksRaw } = projectIds.length
    ? await service
        .from("lead_unlocks")
        .select("project_id, paid_at")
        .eq("pro_id", pro.id)
        .in("project_id", projectIds)
    : { data: [] as { project_id: number; paid_at: string }[] };
  const unlockedMap = new Map<number, string>();
  (unlocksRaw || []).forEach((u) => unlockedMap.set(u.project_id, u.paid_at));

  return (
    <div className="space-y-8">
      {/* Banners */}
      {unlockedId && (
        <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/10 text-green-800">
          <p className="text-sm font-medium">
            ✓ Projet #{unlockedId} débloqué ! Les coordonnées du particulier sont
            maintenant visibles ci-dessous.
          </p>
        </div>
      )}
      {alreadyUnlockedId && (
        <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-800">
          <p className="text-sm font-medium">
            Ce projet est déjà débloqué. Les coordonnées sont visibles ci-dessous.
          </p>
        </div>
      )}
      {canceledId && (
        <div className="p-4 rounded-lg border border-orange-500/20 bg-orange-500/10 text-orange-800">
          <p className="text-sm font-medium">
            Paiement annulé pour le projet #{canceledId}. Vous pouvez réessayer
            quand vous voulez.
          </p>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-800">
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          Leads reçus
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Tous les projets {pro.category?.name || ""} de votre département
          ({proDeptId}). Débloquez les coordonnées pour <strong>9,90€ TTC</strong> par projet (paiement unique,
          sans abonnement).
        </p>
      </div>

      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => {
            const isUnlocked = unlockedMap.has(p.id);
            const suspicionScore =
              p.ai_qualification &&
              typeof (p.ai_qualification as Record<string, unknown>).suspicion_score ===
                "number"
                ? ((p.ai_qualification as Record<string, unknown>).suspicion_score as number)
                : 0;
            const isSuspicious = p.status === "suspicious" || suspicionScore > 70;
            const cityName = Array.isArray(p.cities) ? p.cities[0]?.name : p.cities?.name;
            const fullDesc = p.description || "";
            const parts = fullDesc.split(/\n\n+/);
            const title = (parts[0] || "Projet sans titre").slice(0, 100);
            const body = parts.length > 1 ? parts.slice(1).join("\n\n") : "";
            const displayBody = !isUnlocked && p.has_contact_in_description
              ? p.cleaned_description || body
              : body;

            return (
              <li
                key={p.id}
                className={`p-6 rounded-2xl border transition-colors ${
                  isSuspicious
                    ? "bg-amber-50/50 border-amber-300"
                    : "bg-[var(--bg-secondary)] border-[var(--border)]"
                }`}
              >
                {isSuspicious && (
                  <div className="mb-4 p-3 bg-amber-100/70 border border-amber-300 rounded-lg">
                    <p className="text-xs font-semibold text-amber-900">
                      ⚠️ Projet flagué par notre IA. Vérifiez avant de débloquer.
                    </p>
                  </div>
                )}

                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                      {title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-semibold uppercase tracking-wider">
                        {pro.category?.name || "BTP"}
                      </span>
                      {cityName && (
                        <span className="text-[var(--text-tertiary)]">
                          {cityName}
                        </span>
                      )}
                    </div>
                  </div>
                  {isUnlocked && (
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-green-500/10 text-green-700 shrink-0">
                      ✓ Débloqué
                    </span>
                  )}
                </div>

                {displayBody && (
                  <p className="text-sm text-[var(--text-secondary)] mb-3 whitespace-pre-wrap line-clamp-4">
                    {displayBody}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-tertiary)] mb-4">
                  <span className="font-semibold text-[var(--text-primary)]">
                    {BUDGET_LABELS[p.budget || ""] || p.budget || "À définir"}
                  </span>
                  <span>·</span>
                  <span>
                    Délai : {URGENCY_LABELS[p.urgency || ""] || p.urgency || "—"}
                  </span>
                  <span>·</span>
                  <span>
                    {new Date(p.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Acces coordonnees : Premium uniquement (post-Sprint 13 : pay-per-lead) */}
                {isUnlocked ? (
                  <div className="pt-4 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-[var(--text-tertiary)] tracking-wider mb-1">
                        Client
                      </p>
                      <p className="text-[var(--text-primary)] font-medium">
                        {p.first_name || "Client Workwave"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-[var(--text-tertiary)] tracking-wider mb-1">
                        Contact
                      </p>
                      {p.email && (
                        <a
                          href={`mailto:${p.email}`}
                          className="block text-[var(--accent)] underline hover:no-underline"
                        >
                          {p.email}
                        </a>
                      )}
                      {p.phone && (
                        <a
                          href={`tel:${p.phone}`}
                          className="block text-[var(--text-secondary)]"
                        >
                          {p.phone}
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-[var(--border)]">
                    <p className="text-xs text-[var(--text-tertiary)] mb-3">
                      Pour voir le nom, email et téléphone du particulier :
                    </p>
                    <form action={startBtpUnlock}>
                      <input type="hidden" name="projectId" value={p.id} />
                      <SubmitButton
                        pendingText="Redirection Stripe..."
                        className="inline-flex items-center justify-center h-11 px-5 text-sm font-semibold rounded-lg bg-[var(--accent)] hover:opacity-90 text-white transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Débloquer pour 9,90€ TTC
                      </SubmitButton>
                    </form>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-2">
                      Paiement sécurisé Stripe · Unique · Sans engagement
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

type ProjectRow = {
  id: number;
  description: string | null;
  budget: string | null;
  urgency: string | null;
  status: string;
  created_at: string;
  ai_qualification: Record<string, unknown> | null;
  first_name: string | null;
  email: string | null;
  phone: string | null;
  category_id: number;
  cleaned_description: string | null;
  has_contact_in_description: boolean;
  cities:
    | { name: string }
    | { name: string }[]
    | null;
};

function EmptyState() {
  return (
    <div className="text-center py-16 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl">
      <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-[var(--text-tertiary)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        Aucun projet pour l&apos;instant
      </h2>
      <p className="text-sm text-[var(--text-secondary)] mb-1 max-w-md mx-auto">
        Vous êtes inscrit au broadcast. Dès qu&apos;un particulier de votre
        département publie un projet correspondant à votre catégorie, vous
        recevrez un email + une notification ici.
      </p>
      <p className="text-xs text-[var(--text-tertiary)]">
        Vous pouvez mettre votre fiche en pause depuis Préférences.
      </p>
    </div>
  );
}
