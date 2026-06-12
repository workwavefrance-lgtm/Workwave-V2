import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

/**
 * Maillage interne fiche pro → guides de prix du métier (530 guides sourcés
 * Perplexity, sous-exploités : avant ce composant, AUCUNE fiche n'y linkait).
 * Server Component async autonome : requête légère (slug+h1 sur table 530
 * rows, indexée par metier_slug), rendu conditionnel, cache ISR de la fiche.
 */
export default async function ProGuidesLinks({
  metierSlug,
  metierName,
}: {
  metierSlug: string;
  metierName: string;
}) {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: guides } = await sb
    .from("price_guides")
    .select("slug, h1, scope")
    .eq("metier_slug", metierSlug)
    .eq("status", "published")
    .order("scope", { ascending: true }) // "metier" avant "prestation"
    .limit(4);

  if (!guides || guides.length === 0) return null;

  return (
    <div className="pt-6">
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
        Prix et conseils {metierName.toLowerCase()}
      </h3>
      <ul className="space-y-2">
        {guides.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/guide-des-prix/${g.slug}`}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              {g.h1 || `Guide des prix ${metierName.toLowerCase()}`}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
