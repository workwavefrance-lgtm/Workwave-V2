/**
 * Calcule la distance "à vol d'oiseau" en kilomètres entre 2 points lat/lng.
 *
 * Formule Haversine, précision ~0.5 % suffisante pour les rayons d'intervention
 * pros (5-200 km). Coût : ~0.001 ms par appel → négligeable.
 *
 * Utilisé par broadcastBtpProject pour respecter le `intervention_radius_km`
 * de chaque pro (au lieu du filtre "même département" qui rate les leads
 * cross-départementaux).
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // rayon Terre en km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
