"use client";

import { useState } from "react";
import { FRANCE_MAP_VIEWBOX, FRANCE_DEPT_PATHS } from "@/lib/data/france-departements-paths";

export type ChoroDatum = {
  name: string;
  densite: number;
  rank: number;
  pros: number;
  slug: string; // slug département pour le lien (ex: vienne-86)
};

// Rampe coral clair → foncé (plus d'artisans/hab = plus intense). Lisible clair + sombre.
const RAMP = ["#FCE7DE", "#FBCDBE", "#FBA88C", "#FB7A50", "#EA580C", "#C2410C"];
const THRESHOLDS = [200, 300, 400, 500, 600];
function colorFor(d: number): string {
  for (let i = 0; i < THRESHOLDS.length; i++) if (d < THRESHOLDS[i]) return RAMP[i];
  return RAMP[RAMP.length - 1];
}

export default function FranceChoropleth({ data }: { data: Record<string, ChoroDatum> }) {
  const [hover, setHover] = useState<{ code: string; x: number; y: number } | null>(null);
  const codes = Object.keys(FRANCE_DEPT_PATHS);
  const active = hover ? data[hover.code] : null;

  return (
    <div className="relative w-full">
      <svg
        viewBox={FRANCE_MAP_VIEWBOX}
        className="w-full h-auto"
        role="img"
        aria-label="Carte de France : densité d'entreprises artisanales par département"
        onMouseLeave={() => setHover(null)}
      >
        {codes.map((code) => {
          const d = data[code];
          const fill = d ? colorFor(d.densite) : "#E5E7EB";
          const isHover = hover?.code === code;
          return (
            <path
              key={code}
              d={FRANCE_DEPT_PATHS[code]}
              fill={fill}
              stroke="#ffffff"
              strokeWidth={isHover ? 2.2 : 0.7}
              style={{ cursor: d ? "pointer" : "default", transition: "stroke-width .1s" }}
              onMouseEnter={(e) => {
                const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                setHover({ code, x: e.clientX - box.left, y: e.clientY - box.top });
              }}
              onMouseMove={(e) => {
                const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                setHover({ code, x: e.clientX - box.left, y: e.clientY - box.top });
              }}
            />
          );
        })}
      </svg>

      {/* Tooltip */}
      {active && hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 shadow-md text-sm"
          style={{ left: Math.min(hover.x + 12, 260), top: Math.max(hover.y - 10, 0) }}
        >
          <div className="font-semibold text-[var(--text-primary)]">
            {active.name} <span className="text-[var(--text-tertiary)] font-normal">#{active.rank}</span>
          </div>
          <div className="text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--accent)]">{String(active.densite).replace(".", ",")}</span> entreprises / 10 000 hab
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">
            {active.pros.toLocaleString("fr-FR")} entreprises référencées
          </div>
        </div>
      )}

      {/* Légende */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--text-secondary)]">
        <span className="text-[var(--text-tertiary)]">Entreprises / 10 000 hab :</span>
        {["< 200", "200-300", "300-400", "400-500", "500-600", "600 +"].map((lbl, i) => (
          <span key={lbl} className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3.5 h-3.5 rounded" style={{ background: RAMP[i] }} />
            {lbl}
          </span>
        ))}
      </div>
    </div>
  );
}
