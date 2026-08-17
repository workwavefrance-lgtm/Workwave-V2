import Link from "next/link";
import { getServiceClient } from "@/lib/supabase/service-client";

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
  // Client PARTAGE. Avant le 09/08 ce composant fabriquait un client neuf a
  // chaque rendu, donc sur CHAQUE fiche pro, la route la plus crawlee du site.
  // Chaque client lancait une minuterie de 30 s jamais arretee, ce qui le rendait
  // impossible a liberer : ~8,7 Ko retenus definitivement par fiche affichee.
  // Cf. lib/supabase/service-client.ts.
  const sb = getServiceClient();
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
