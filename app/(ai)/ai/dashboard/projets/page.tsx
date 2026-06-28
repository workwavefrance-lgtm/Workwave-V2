import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAiProByUserId } from "@/lib/queries/pros";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";
import { markProjectAsContacted, startTechUnlock } from "./actions";

export const metadata: Metadata = {
  title: "Tous les projets — Dashboard Workwave AI",
  description: "Tous les projets publies sur Workwave AI, en temps reel (tech, marketing, finance, juridique, RH, design, creation, audiovisuel).",
  robots: { index: false, follow: false },
};

const BUDGET_LABELS: Record<string, string> = {
  lt5k: "< 5 000 €",
  "5k-15k": "5 000 - 15 000 €",
  "15k-50k": "15 000 - 50 000 €",
  gt50k: "> 50 000 €",
  tbd: "A definir",
};

const TIMELINE_LABELS: Record<string, string> = {
  asap: "Immediat (< 1 semaine)",
  "1month": "Sous 1 mois",
  "3months": "Dans 1 a 3 mois",
  flexible: "Flexible",
};

// Limite d'affichage : 50 projets les plus recents (pagination future si besoin)
const PROJECTS_LIMIT = 50;

/**
 * Masque les coordonnées (email + téléphone FR) d'un texte tant que le projet
 * n'est pas débloqué — défense RGPD : aucune PII dans le HTML d'un projet locké.
 */
function scrubPii(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "•••@•••")
    .replace(/(?:\+33|0)[\s.-]?[1-9](?:[\s.-]?\d{2}){4}/g, "•• •• •• •• ••");
}

export default async function AiDashboardProjetsPage({
  searchParams,
}: {
  searchParams: Promise<{
    marked?: string;
    error?: string;
    cat?: string;
    budget?: string;
    unlocked?: string;
    canceled?: string;
    already_unlocked?: string;
  }>;
}) {
  const sp = await searchParams;
  const justMarked = sp.marked === "contacted";
  const justUnlocked = !!sp.unlocked;
  const justCanceled = !!sp.canceled;
  const alreadyUnlocked = !!sp.already_unlocked;
  const errKey = sp.error;
  const filterCat = sp.cat || "all";
  const filterBudget = sp.budget || "all";

  const errorMsg =
    errKey === "invalid_project"
      ? "Lien invalide. Reessayez."
      : errKey === "unauthorized"
      ? "Vous n'avez pas acces a ce projet."
      : errKey === "project_not_found"
      ? "Projet introuvable."
      : errKey === "not_unlocked"
      ? "Débloquez d'abord ce projet pour accéder aux coordonnées."
      : errKey === "cgv_required"
      ? "Vous devez accepter les CGV pour débloquer un projet."
      : errKey === "stripe_not_configured"
      ? "Le paiement est momentanément indisponible. Réessayez plus tard."
      : errKey === "checkout_failed"
      ? "Le paiement n'a pas pu démarrer. Réessayez."
      : "";

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

  // Charger toutes les categories Workwave AI (14 verticaux) pour les filtres
  const { data: categoriesRaw } = await service
    .from("categories")
    .select("id, slug, name")
    .in("id", AI_CATEGORY_IDS)
    .order("name");
  const categories = categoriesRaw || [];

  // Charger tous les projets Workwave AI actifs (Phase 11 broadcast model :
  // tous les freelances voient TOUS les projets, plus de project_leads filter).
  // Note : on inclut les projets "suspicious" (l'IA flag mais on les montre
  // quand meme avec une card "ATTENTION" — cf. decision user 26/05).
  // NB: la table `projects` n'a PAS de colonne `deleted_at` — le soft-delete
  // se fait via `status='deleted'` (cf. /deposer-projet/supprimer). Le seul
  // filtre necessaire est donc .neq("status", "deleted").
  let projectsQuery = service
    .from("projects")
    .select(
      "id, description, budget, urgency, status, created_at, ai_qualification, first_name, email, phone, category_id, categories(name, slug)"
    )
    .eq("vertical", "tech")
    .neq("status", "deleted")
    .order("created_at", { ascending: false })
    .limit(PROJECTS_LIMIT);

  // Filtre catégorie
  if (filterCat !== "all") {
    const cat = categories.find((c) => c.slug === filterCat);
    if (cat) projectsQuery = projectsQuery.eq("category_id", cat.id);
  }

  // Filtre budget
  if (filterBudget !== "all") {
    projectsQuery = projectsQuery.eq("budget", filterBudget);
  }

  const { data: projectsRaw } = await projectsQuery;

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
    categories:
      | { name: string; slug: string }
      | { name: string; slug: string }[]
      | null;
  };

  const projectsRows = (projectsRaw || []) as ProjectRow[];

  // Charger les leads existants du pro pour savoir lesquels sont deja "contactes"
  const projectIds = projectsRows.map((p) => p.id);
  const { data: leadsRaw } = projectIds.length
    ? await service
        .from("project_leads")
        .select("project_id, contacted_at")
        .eq("pro_id", pro.id)
        .in("project_id", projectIds)
    : { data: [] as { project_id: number; contacted_at: string | null }[] };
  const contactedMap = new Map<number, boolean>();
  (leadsRaw || []).forEach((l) => {
    if (l.contacted_at) contactedMap.set(l.project_id, true);
  });

  // Unlocks (pay-per-lead) : quels projets ce pro a déjà débloqués (9,90 €)
  const { data: unlocksRaw } = projectIds.length
    ? await service
        .from("lead_unlocks")
        .select("project_id")
        .eq("pro_id", pro.id)
        .in("project_id", projectIds)
    : { data: [] as { project_id: number }[] };
  const unlockedSet = new Set<number>(
    (unlocksRaw || []).map((u) => u.project_id)
  );

  const projects = projectsRows.map((proj) => {
    const fullDesc = proj.description || "";
    const parts = fullDesc.split(/\n\n+/);
    const title = (parts[0] || "").trim() || "Projet sans titre";
    const body = parts.length > 1 ? parts.slice(1).join("\n\n").trim() : "";
    const cat = Array.isArray(proj.categories) ? proj.categories[0] : proj.categories;
    const suspicionScore =
      proj.ai_qualification &&
      typeof (proj.ai_qualification as Record<string, unknown>).suspicion_score === "number"
        ? ((proj.ai_qualification as Record<string, unknown>).suspicion_score as number)
        : 0;
    const unlocked = unlockedSet.has(proj.id);
    return {
      id: proj.id,
      title: (unlocked ? title : scrubPii(title)).slice(0, 100),
      // Description scrubée (emails/tél masqués) tant que pas débloqué.
      description: unlocked ? body : scrubPii(body),
      budget: BUDGET_LABELS[proj.budget || ""] || proj.budget || "A definir",
      timeline: TIMELINE_LABELS[proj.urgency || ""] || proj.urgency || "Flexible",
      receivedAt: proj.created_at,
      status: proj.status,
      isSuspicious: proj.status === "suspicious" || suspicionScore > 70,
      categoryName: cat?.name || "Workwave AI",
      categorySlug: cat?.slug || "ai",
      unlocked,
      // Coordonnées UNIQUEMENT si débloqué (sinon jamais envoyées dans le HTML).
      clientName: unlocked ? proj.first_name : null,
      clientEmail: unlocked ? proj.email : null,
      clientPhone: unlocked ? proj.phone : null,
      alreadyContacted: contactedMap.get(proj.id) || false,
    };
  });

  return (
    <div className="max-w-5xl">
      {justMarked && (
        <div
          className="mb-6 p-4 rounded-lg border border-green-500/20 bg-green-500/10 text-green-800"
          role="status"
        >
          <p className="text-sm font-medium">✓ Projet marque comme contacte.</p>
        </div>
      )}
      {justUnlocked && (
        <div
          className="mb-6 p-4 rounded-lg border border-green-500/20 bg-green-500/10 text-green-800"
          role="status"
        >
          <p className="text-sm font-medium">
            ✓ Projet débloqué ! Les coordonnées du client sont visibles
            ci-dessous.
          </p>
        </div>
      )}
      {alreadyUnlocked && (
        <div
          className="mb-6 p-4 rounded-lg border border-[var(--ai-border)] bg-[var(--ai-bg-subtle)] text-[var(--ai-text-secondary)]"
          role="status"
        >
          <p className="text-sm font-medium">
            Vous aviez déjà débloqué ce projet — coordonnées visibles ci-dessous.
          </p>
        </div>
      )}
      {justCanceled && (
        <div
          className="mb-6 p-4 rounded-lg border border-[var(--ai-border)] bg-[var(--ai-bg-subtle)] text-[var(--ai-text-secondary)]"
          role="status"
        >
          <p className="text-sm font-medium">
            Paiement annulé. Le projet n&apos;a pas été débloqué.
          </p>
        </div>
      )}
      {errorMsg && (
        <div
          className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-800"
          role="alert"
        >
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      <div className="mb-8">
        <p
          className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          [ DASHBOARD · PROJETS EN TEMPS REEL ]
        </p>
        <h1
          className="font-black text-[var(--ai-text)] uppercase mb-3"
          style={{
            fontSize: "clamp(28px, 4.5vw, 48px)",
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
          }}
        >
          Tous les projets.
        </h1>
        <p className="text-base text-[var(--ai-text-secondary)] leading-relaxed">
          Tous les projets publiés sur Workwave, en temps réel. Filtrez par
          savoir-faire pour ne voir que ceux qui vous intéressent.{" "}
          <strong className="text-[var(--ai-text)]">
            Débloquez les coordonnées d&apos;un projet pour 9,90 € — sans
            abonnement.
          </strong>
        </p>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex flex-wrap gap-2">
        <FilterPill
          href="/ai/dashboard/projets"
          label="Toutes categories"
          active={filterCat === "all"}
        />
        {categories.map((c) => (
          <FilterPill
            key={c.slug}
            href={`/ai/dashboard/projets?cat=${c.slug}${filterBudget !== "all" ? `&budget=${filterBudget}` : ""}`}
            label={c.name}
            active={filterCat === c.slug}
          />
        ))}
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <FilterPill
          href={
            filterCat !== "all"
              ? `/ai/dashboard/projets?cat=${filterCat}`
              : "/ai/dashboard/projets"
          }
          label="Tous budgets"
          active={filterBudget === "all"}
          small
        />
        {Object.entries(BUDGET_LABELS).map(([key, label]) => (
          <FilterPill
            key={key}
            href={`/ai/dashboard/projets?budget=${key}${filterCat !== "all" ? `&cat=${filterCat}` : ""}`}
            label={label}
            active={filterBudget === key}
            small
          />
        ))}
      </div>

      {projects.length === 0 ? (
        <EmptyState filterActive={filterCat !== "all" || filterBudget !== "all"} />
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => (
            <li
              key={p.id}
              className={`p-6 rounded-2xl transition-colors border ${
                p.isSuspicious
                  ? "bg-amber-50/50 border-amber-300 hover:border-amber-500"
                  : "bg-[var(--ai-bg-card)] border-[var(--ai-border-subtle)] hover:border-[var(--ai-text)]"
              }`}
            >
              {/* Banner ATTENTION pour les projets suspicious (lecon 26/05) */}
              {p.isSuspicious && (
                <div className="mb-4 p-3 bg-amber-100/70 border border-amber-300 rounded-lg">
                  <p className="text-[12px] font-semibold text-amber-900 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>
                      Projet flague par notre IA. Verifiez les informations
                      avant de contacter.
                    </span>
                  </p>
                </div>
              )}

              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <h3 className="text-[17px] font-bold text-[var(--ai-text)] mb-1">
                    {p.title}
                  </h3>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--ai-accent)]/10 text-[var(--ai-accent)]">
                    {p.categoryName}
                  </span>
                </div>
                {p.alreadyContacted && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-green-500/10 text-green-700">
                    Contacte
                  </span>
                )}
              </div>

              {p.description && (
                <p className="text-sm text-[var(--ai-text-secondary)] mb-3 line-clamp-3 whitespace-pre-wrap">
                  {p.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-[12px] text-[var(--ai-text-tertiary)] mb-4">
                <span className="font-semibold text-[var(--ai-text)]">{p.budget}</span>
                <span>·</span>
                <span>Delai : {p.timeline}</span>
                <span>·</span>
                <span>
                  {new Date(p.receivedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {/* Acces aux coordonnees : pay-per-lead 9,90 € (deblocage par projet) */}
              {p.unlocked ? (
                <>
                  <div className="pt-4 border-t border-[var(--ai-border-subtle)] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px] mb-4">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] tracking-wider mb-1">
                        Client
                      </p>
                      <p className="text-[var(--ai-text)] font-medium">
                        {p.clientName || "Client Workwave"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] tracking-wider mb-1">
                        Contact
                      </p>
                      {p.clientEmail && (
                        <a
                          href={`mailto:${p.clientEmail}`}
                          className="text-[var(--ai-accent)] underline decoration-[var(--ai-border)] hover:text-[var(--ai-accent-hover)]"
                        >
                          {p.clientEmail}
                        </a>
                      )}
                      {p.clientPhone && (
                        <a
                          href={`tel:${p.clientPhone}`}
                          className="block text-[var(--ai-text-secondary)]"
                        >
                          {p.clientPhone}
                        </a>
                      )}
                    </div>
                  </div>
                  {!p.alreadyContacted && (
                    <form action={markProjectAsContacted}>
                      <input type="hidden" name="projectId" value={p.id} />
                      <button
                        type="submit"
                        className="text-[12px] font-semibold text-[var(--ai-text-secondary)] hover:text-[var(--ai-accent)] underline decoration-[var(--ai-border)] underline-offset-2 transition-colors"
                      >
                        ✓ J&apos;ai contacté ce client
                      </button>
                    </form>
                  )}
                </>
              ) : (
                <div className="pt-4 border-t border-[var(--ai-border-subtle)]">
                  <form action={startTechUnlock}>
                    <input type="hidden" name="projectId" value={p.id} />
                    <label className="flex items-start gap-2 text-[12px] text-[var(--ai-text-secondary)] mb-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="cgvAccepted"
                        required
                        className="mt-0.5 accent-[var(--ai-accent)]"
                      />
                      <span>
                        J&apos;accepte les{" "}
                        <Link href="/cgv" target="_blank" className="underline">
                          CGV
                        </Link>
                        . Le déblocage donne accès aux coordonnées de ce projet.
                      </span>
                    </label>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 h-11 px-6 text-[14px] font-semibold rounded-full bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
                    >
                      Débloquer ce projet — 9,90 €
                    </button>
                    <p className="text-[11px] text-[var(--ai-text-tertiary)] mt-2">
                      Paiement unique, sans abonnement. Vous voyez le projet
                      avant de payer.
                    </p>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterPill({
  href,
  label,
  active,
  small = false,
}: {
  href: string;
  label: string;
  active: boolean;
  small?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center ${small ? "h-7 px-2.5 text-[11px]" : "h-8 px-3 text-[12px]"} font-semibold rounded-full border transition-colors ${
        active
          ? "bg-[var(--ai-text)] text-white border-[var(--ai-text)]"
          : "bg-[var(--ai-bg-card)] text-[var(--ai-text-secondary)] border-[var(--ai-border-subtle)] hover:border-[var(--ai-text)] hover:text-[var(--ai-text)]"
      }`}
    >
      {label}
    </Link>
  );
}

function EmptyState({ filterActive }: { filterActive: boolean }) {
  return (
    <div className="text-center py-16 bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl">
      <div
        className="grid grid-cols-2 grid-rows-2 gap-[3px] w-12 h-12 mx-auto mb-6"
        aria-hidden="true"
      >
        <div className="bg-[var(--ai-accent)] rounded-[3px] opacity-30" />
        <div className="bg-[var(--ai-text)] rounded-[3px] opacity-20" />
        <div className="bg-[var(--ai-text)] rounded-[3px] opacity-20" />
        <div className="bg-[var(--ai-accent)] rounded-[3px] opacity-30" />
      </div>
      <h2 className="text-[20px] font-bold text-[var(--ai-text)] mb-2">
        {filterActive
          ? "Aucun projet ne correspond aux filtres"
          : "Aucun projet publie pour l'instant"}
      </h2>
      <p className="text-[14px] text-[var(--ai-text-secondary)] mb-6 max-w-md mx-auto leading-relaxed">
        {filterActive
          ? "Essayez d'elargir vos filtres ou revenez plus tard. De nouveaux projets sont publies chaque jour."
          : "Workwave AI est en lancement, le volume de projets monte progressivement. Vous serez alerte par email a chaque nouveau projet."}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {filterActive && (
          <Link
            href="/ai/dashboard/projets"
            className="inline-flex items-center justify-center h-11 px-6 text-[13px] font-semibold rounded-lg bg-[var(--ai-text)] hover:bg-[#1F1F1F] text-white transition-colors"
          >
            Reinitialiser les filtres
          </Link>
        )}
      </div>
    </div>
  );
}
