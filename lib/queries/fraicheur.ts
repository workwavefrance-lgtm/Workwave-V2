import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public-client";

/**
 * Le « flux de fraîcheur » : les pages qui ont RÉELLEMENT changé récemment,
 * avec leur vraie date. Source unique pour trois consommateurs :
 *   - /sitemap-fraicheur.xml (sitemap avec lastmod fiable),
 *   - /flux-mises-a-jour.xml (flux Atom, relu très souvent par Google),
 *   - le bloc « Mis à jour cette semaine » de la page d'accueil.
 *
 * POURQUOI (01/09/2026). Mesure sur app/sitemap.ts : toutes les pages y ont
 * pour lastmod « maintenant ». Google a documenté qu'un lastmod uniforme ou
 * faux est ignoré. On perdait donc le seul signal de priorité gratuit qu'il
 * écoute. Ici, chaque date est celle de la colonne `updated_at`, ou la date
 * de déploiement d'un lot de pages retravaillées : jamais « maintenant ».
 *
 * Règle du projet : aucun chiffre ou date inventé.
 */

export type PageFraiche = {
  url: string;
  titre: string;
  modifieLe: string; // ISO 8601
};

const BASE = "https://workwave.fr";

// Date de mise en ligne des 132 pages /trouver-des-chantiers retravaillées
// (commit 4d40798). À mettre à jour à la prochaine refonte de ces pages, ou
// la date deviendrait fausse, ce qui est pire qu'absente.
const DATE_MAJ_CHANTIERS = "2026-09-01T11:13:00Z";

async function pagesChantiers(): Promise<PageFraiche[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("categories")
    .select("slug, name")
    .eq("vertical", "btp")
    .order("slug");
  if (error) throw new Error(`fraicheur categories : ${error.message}`);
  return (data || []).map((c) => ({
    url: `${BASE}/trouver-des-chantiers/${c.slug}`,
    titre: `Trouver des chantiers ${c.name.toLowerCase()}`,
    modifieLe: DATE_MAJ_CHANTIERS,
  }));
}

// Fiches modifiées dans la fenêtre. `limite` reste ≤ 1000 : cap PostgREST
// (leçon du 09/05), et au-delà le fichier perdrait son sens de « fraîcheur ».
export const getFichesFraiches = cache(
  async (jours: number, limite: number): Promise<PageFraiche[]> => {
    const sb = createPublicClient();
    const depuis = new Date(Date.now() - jours * 86400e3).toISOString();
    const { data, error } = await sb
      .from("pros")
      .select("slug, name, updated_at")
      .eq("is_active", true)
      .is("deleted_at", null)
      .gt("updated_at", depuis)
      .order("updated_at", { ascending: false })
      .limit(Math.min(limite, 1000));
    if (error) throw new Error(`fraicheur pros : ${error.message}`);
    return (data || []).map((p) => ({
      url: `${BASE}/artisan/${p.slug}`,
      titre: p.name,
      modifieLe: new Date(p.updated_at).toISOString(),
    }));
  },
);

/** Tout le flux, trié de la plus récente à la plus ancienne. */
export const getFluxFraicheur = cache(async (): Promise<PageFraiche[]> => {
  const [chantiers, fiches] = await Promise.all([
    pagesChantiers(),
    getFichesFraiches(14, 1000),
  ]);
  return [...chantiers, ...fiches].sort((a, b) =>
    b.modifieLe.localeCompare(a.modifieLe),
  );
});
