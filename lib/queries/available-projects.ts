import type { SupabaseClient } from "@supabase/supabase-js";
import { haversineKm } from "@/lib/utils/haversine";
import {
  getGeneralistCategoryIds,
  getAllBtpCategoryIds,
} from "@/lib/matching/generalist";

/**
 * Projets DÉJÀ disponibles pour un pro dans sa zone, au moment T.
 *
 * Réplique EXACTEMENT la logique du dashboard /pro/dashboard/leads :
 * catégorie principale + secondaires, expansion « généraliste » (multiservice /
 * petit-bricolage → tout le BTP), filtre distance Haversine ≤ rayon
 * d'intervention, fallback département si coordonnées manquantes.
 *
 * Usage : mail de bienvenue après réclamation (« X projets vous attendent déjà »).
 * ZÉRO PII : on ne renvoie QUE des champs structurés (métier, ville, délai,
 * distance). On n'expose JAMAIS de texte libre (ni description, ni résumé IA)
 * dans un mail pré-déblocage : un résumé IA est dérivé de la description brute
 * du client et pourrait contenir un nom/téléphone → fuite avant paiement.
 */

const URGENCY_LABELS: Record<string, string> = {
  today: "aujourd'hui",
  this_week: "cette semaine",
  this_month: "ce mois-ci",
  not_urgent: "pas urgent",
};

export type AvailableProject = {
  id: number;
  metier: string;
  city: string;
  urgencyLabel: string | null;
  distanceKm: number | null;
};

export type AvailableProjectsResult = {
  count: number;
  top: AvailableProject[];
};

export type ProZone = {
  category_id: number;
  secondary_category_ids: number[] | null;
  intervention_radius_km: number | null;
  city: {
    latitude: number | null;
    longitude: number | null;
    department_id: number | null;
  } | null;
};

type ProjectRow = {
  id: number;
  urgency: string | null;
  category_id: number;
  cities:
    | { name?: string; latitude?: number | null; longitude?: number | null; department_id?: number | null }
    | { name?: string; latitude?: number | null; longitude?: number | null; department_id?: number | null }[]
    | null;
  categories: { name?: string } | { name?: string }[] | null;
};

function pick<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export async function getAvailableProjectsForPro(
  sb: SupabaseClient,
  pro: ProZone,
  topN = 3
): Promise<AvailableProjectsResult> {
  if (!pro.city) return { count: 0, top: [] };

  const proLat = pro.city.latitude ?? null;
  const proLng = pro.city.longitude ?? null;
  const proDeptId = pro.city.department_id ?? null;
  const radiusKm = pro.intervention_radius_km ?? 200;

  // Catégories = principale + secondaires, + expansion généraliste éventuelle.
  const categoryIds = new Set<number>([
    pro.category_id,
    ...((pro.secondary_category_ids as number[] | null) || []),
  ]);
  const generalistIds = await getGeneralistCategoryIds(sb);
  if (generalistIds.some((id) => categoryIds.has(id))) {
    (await getAllBtpCategoryIds(sb)).forEach((id) => categoryIds.add(id));
  }

  // Table projects petite → on charge les projets des métiers du pro puis on
  // filtre par distance côté JS (comme le dashboard). Limite large de sécurité.
  const { data: raw } = await sb
    .from("projects")
    .select(
      "id, urgency, category_id, cities(name, latitude, longitude, department_id), categories(name)"
    )
    .eq("vertical", "btp")
    .in("category_id", Array.from(categoryIds))
    .neq("status", "deleted")
    .order("created_at", { ascending: false })
    .limit(300);

  const matched = ((raw || []) as unknown as ProjectRow[])
    .map((p) => {
      const c = pick(p.cities);
      const cat = pick(p.categories);
      const cLat = c?.latitude ?? null;
      const cLng = c?.longitude ?? null;
      let dist: number | null = null;
      let inZone: boolean;
      if (proLat != null && proLng != null && cLat != null && cLng != null) {
        dist = haversineKm(proLat, proLng, cLat, cLng);
        inZone = dist <= radiusKm;
      } else {
        // Fallback (coordonnées manquantes) : même département.
        inZone = proDeptId != null && (c?.department_id ?? null) === proDeptId;
      }
      return { p, c, cat, dist, inZone };
    })
    .filter((x) => x.inZone);

  const top = matched
    .slice()
    .sort((a, b) => {
      // Plus proche en premier ; distance inconnue en dernier.
      if (a.dist == null && b.dist == null) return 0;
      if (a.dist == null) return 1;
      if (b.dist == null) return -1;
      return a.dist - b.dist;
    })
    .slice(0, topN)
    .map(({ p, c, cat, dist }) => ({
      id: p.id,
      metier: cat?.name || "Projet BTP",
      city: c?.name || "",
      urgencyLabel: p.urgency ? URGENCY_LABELS[p.urgency] || null : null,
      distanceKm: dist != null ? Math.round(dist) : null,
    }));

  return { count: matched.length, top };
}
