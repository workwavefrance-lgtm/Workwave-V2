import type { Metadata } from "next";
import Link from "next/link";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";

// Page publique (indexable) : teaser des projets en ligne pour convertir les
// visiteurs en inscrits. AUCUNE donnee personnelle exposee (pas de description,
// pas de nom/email/tel) -> uniquement categorie + budget + delai + date.
export const metadata: Metadata = {
  title: "Projets freelance en ligne — Workwave AI",
  description:
    "Des entreprises publient chaque semaine des projets tech, marketing, design, finance, juridique, RH et audiovisuel sur Workwave AI. Inscrivez-vous gratuitement pour voir les details et repondre.",
  alternates: { canonical: "https://workwave.fr/ai/projets" },
  robots: { index: true, follow: true },
};

export const revalidate = 600; // cache 10 min

const BUDGET_LABELS: Record<string, string> = {
  lt5k: "< 5 000 €",
  "5k-15k": "5 000 - 15 000 €",
  "15k-50k": "15 000 - 50 000 €",
  gt50k: "> 50 000 €",
  tbd: "Budget à définir",
};
const TIMELINE_LABELS: Record<string, string> = {
  asap: "Immédiat",
  "1month": "Sous 1 mois",
  "3months": "1 à 3 mois",
  flexible: "Flexible",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "il y a moins d'une heure";
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "hier";
  if (d < 30) return `il y a ${d} jours`;
  const m = Math.floor(d / 30);
  return m <= 1 ? "il y a 1 mois" : `il y a ${m} mois`;
}

export default async function AiProjetsPublicPage() {
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Projets tech actifs, NON suspicious (on ne met pas en avant les flaggés).
  // Champs SUR uniquement : categorie + budget + urgence + date.
  const { data: rows, count } = await service
    .from("projects")
    .select("id, budget, urgency, created_at, categories(name, slug)", {
      count: "exact",
    })
    .eq("vertical", "tech")
    .neq("status", "deleted")
    .neq("status", "suspicious")
    .order("created_at", { ascending: false })
    .limit(24);

  type Row = {
    id: number;
    budget: string | null;
    urgency: string | null;
    created_at: string;
    categories: { name: string; slug: string } | { name: string; slug: string }[] | null;
  };
  const projects = ((rows || []) as Row[]).map((p) => {
    const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories;
    return {
      id: p.id,
      category: cat?.name || "Workwave AI",
      budget: BUDGET_LABELS[p.budget || ""] || "Budget à définir",
      timeline: TIMELINE_LABELS[p.urgency || ""] || "Flexible",
      ago: timeAgo(p.created_at),
    };
  });
  const total = count || projects.length;

  return (
    <div className="max-w-5xl mx-auto px-5 py-16 md:py-24">
      {/* Hero */}
      <div className="mb-12 text-center">
        <p
          className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-4"
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          [ PROJETS EN LIGNE · TEMPS RÉEL ]
        </p>
        <h1
          className="font-black text-[var(--ai-text)] uppercase mb-4"
          style={{ fontSize: "clamp(32px, 6vw, 64px)", lineHeight: 0.95, letterSpacing: "-0.04em" }}
        >
          {total > 0 ? (
            <>
              {total} projet{total > 1 ? "s" : ""}
              <br />
              cherchent un freelance.
            </>
          ) : (
            <>Les premiers projets arrivent.</>
          )}
        </h1>
        <p className="text-base md:text-lg text-[var(--ai-text-secondary)] max-w-2xl mx-auto leading-relaxed mb-8">
          Des entreprises publient leurs missions (tech, marketing, design, finance,
          juridique, RH, audiovisuel) sur Workwave AI.{" "}
          <strong className="text-[var(--ai-text)]">
            Inscrivez-vous gratuitement pour voir les détails et répondre.
          </strong>
        </p>
        <Link
          href="/ai/inscription"
          className="inline-flex items-center justify-center h-12 px-7 text-[15px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
        >
          Créer mon compte freelance — gratuit
        </Link>
      </div>

      {/* Cards floutées */}
      {projects.length > 0 ? (
        <>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((p) => (
              <li
                key={p.id}
                className="relative p-5 rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)] overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--ai-accent)]/10 text-[var(--ai-accent)]">
                    {p.category}
                  </span>
                  <span className="text-[11px] text-[var(--ai-text-tertiary)]">{p.ago}</span>
                </div>

                {/* Zone "détails" floutée + cadenas */}
                <div className="relative mb-4">
                  <div className="space-y-2 select-none blur-[5px]" aria-hidden="true">
                    <div className="h-3 rounded bg-[var(--ai-text)]/15 w-full" />
                    <div className="h-3 rounded bg-[var(--ai-text)]/15 w-11/12" />
                    <div className="h-3 rounded bg-[var(--ai-text)]/15 w-3/4" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-semibold text-[var(--ai-text-secondary)] bg-[var(--ai-bg-card)]/80 px-2 py-1 rounded">
                      🔒 Détails réservés aux membres
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--ai-text-tertiary)]">
                  <span className="font-semibold text-[var(--ai-text)]">{p.budget}</span>
                  <span>·</span>
                  <span>Délai : {p.timeline}</span>
                </div>
              </li>
            ))}
          </ul>

          {/* CTA bas */}
          <div className="mt-10 text-center">
            <p className="text-sm text-[var(--ai-text-secondary)] mb-4">
              Les coordonnées clients et les détails complets sont réservés aux freelances inscrits.
            </p>
            <Link
              href="/ai/inscription"
              className="inline-flex items-center justify-center h-12 px-7 text-[15px] font-semibold rounded-lg bg-[var(--ai-text)] hover:bg-[#1F1F1F] text-white transition-colors"
            >
              Voir tous les projets — inscription gratuite
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center py-12 rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)]">
          <p className="text-[15px] text-[var(--ai-text-secondary)] max-w-md mx-auto leading-relaxed">
            Workwave AI est en lancement. Soyez parmi les premiers freelances inscrits :
            vous serez alerté à chaque nouveau projet de votre domaine.
          </p>
          <Link
            href="/ai/inscription"
            className="inline-flex mt-6 items-center justify-center h-11 px-6 text-[13px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
          >
            M'inscrire gratuitement
          </Link>
        </div>
      )}
    </div>
  );
}
