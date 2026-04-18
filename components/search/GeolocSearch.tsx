"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";

type CityForGeoloc = {
  id: number;
  slug: string;
  name: string;
  lat: number;
  lng: number;
};

type Props = {
  metierSlug: string;
  metierName: string;
  cities: CityForGeoloc[];
};

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestCity(
  cities: CityForGeoloc[],
  lat: number,
  lng: number
): { city: CityForGeoloc; distanceKm: number } | null {
  if (cities.length === 0) return null;
  let best = cities[0];
  let bestDist = haversine(lat, lng, best.lat, best.lng);
  for (let i = 1; i < cities.length; i++) {
    const d = haversine(lat, lng, cities[i].lat, cities[i].lng);
    if (d < bestDist) {
      best = cities[i];
      bestDist = d;
    }
  }
  return { city: best, distanceKm: bestDist };
}

export default function GeolocSearch({ metierSlug, metierName, cities }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualQuery, setManualQuery] = useState("");

  // Suggestions de villes filtrées par la saisie utilisateur
  const suggestions = useMemo(() => {
    const q = manualQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return cities
      .filter((c) => c.name.toLowerCase().startsWith(q))
      .slice(0, 6);
  }, [manualQuery, cities]);

  function handleGeoloc() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur votre navigateur.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const result = findNearestCity(cities, latitude, longitude);
        if (!result) {
          setLoading(false);
          setError("Aucune ville référencée. Tapez votre ville ci-dessous.");
          return;
        }
        // Si la ville la plus proche est à plus de 100km, on prévient
        if (result.distanceKm > 100) {
          setLoading(false);
          setError(
            `Workwave n'est pas encore dans votre région (ville la plus proche : ${result.city.name}, à ${Math.round(result.distanceKm)} km). Tapez votre ville pour voir si elle est couverte.`
          );
          return;
        }
        router.push(`/${metierSlug}/${result.city.slug}`);
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("Géolocalisation refusée. Tapez votre ville ci-dessous.");
        } else {
          setError("Impossible de vous localiser. Tapez votre ville ci-dessous.");
        }
      },
      { timeout: 10_000, maximumAge: 60_000 }
    );
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const exact = cities.find(
      (c) => c.name.toLowerCase() === manualQuery.trim().toLowerCase()
    );
    if (exact) {
      router.push(`/${metierSlug}/${exact.slug}`);
    } else if (suggestions.length > 0) {
      router.push(`/${metierSlug}/${suggestions[0].slug}`);
    } else {
      setError(
        `Aucune ville trouvée pour « ${manualQuery} ». Essayez l'orthographe complète (ex. Poitiers, Châtellerault).`
      );
    }
  }

  return (
    <div className="w-full max-w-2xl">
      {/* CTA géoloc */}
      <button
        onClick={handleGeoloc}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-4 rounded-2xl text-base font-semibold transition-all duration-250 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-wait"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        {loading
          ? "Localisation en cours…"
          : `Trouver un ${metierName.toLowerCase()} près de moi`}
      </button>

      {/* Fallback : saisie manuelle */}
      <form
        onSubmit={handleManualSubmit}
        className="mt-4 flex flex-col sm:flex-row gap-3"
      >
        <div className="flex-1 relative">
          <input
            type="text"
            value={manualQuery}
            onChange={(e) => {
              setManualQuery(e.target.value);
              setError(null);
            }}
            placeholder="ou tapez votre ville (ex. Poitiers)"
            className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl px-5 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-colors duration-200"
            autoComplete="off"
          />
          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 mt-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-md z-10">
              {suggestions.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/${metierSlug}/${c.slug}`)}
                    className="w-full text-left px-5 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors duration-150"
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="submit"
          className="bg-[var(--card-bg)] border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-primary)] hover:text-[var(--accent)] px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-250"
        >
          Rechercher
        </button>
      </form>

      {/* Message d'erreur / info */}
      {error && (
        <p className="mt-4 text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-xl px-4 py-3">
          {error}
        </p>
      )}
    </div>
  );
}
