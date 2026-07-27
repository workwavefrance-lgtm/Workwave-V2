"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FRANCE_MAP_VIEWBOX, FRANCE_DEPT_PATHS } from "@/lib/data/france-departements-paths";
import type { PenurieMetier } from "@/lib/data/barometre-penurie";

const RAMP = ["#FCE7DE", "#FBCDBE", "#FBA88C", "#FB7A50", "#EA580C", "#C2410C"];

function slugify(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
const deptSlug = (name: string, code: string) => `${slugify(name)}-${code}`;
const dec = (n: number) => String(n).replace(".", ",");

export default function PenurieMap({ metiers }: { metiers: PenurieMetier[] }) {
  const [slug, setSlug] = useState(metiers.find((m) => m.slug === "plombier")?.slug || metiers[0].slug);
  const [hover, setHover] = useState<{ code: string; x: number; y: number } | null>(null);
  const m = metiers.find((x) => x.slug === slug)!;

  // Échelle RELATIVE au métier sélectionné (quantiles) : chaque métier a sa propre
  // fourchette de densité, on colore selon sa distribution.
  const thresholds = useMemo(() => {
    const vals = Object.values(m.byDept).slice().sort((a, b) => a - b);
    const q = (p: number) => vals[Math.min(vals.length - 1, Math.floor(p * vals.length))];
    return [q(0.17), q(0.34), q(0.5), q(0.67), q(0.84)];
  }, [m]);
  const colorFor = (d: number) => {
    for (let i = 0; i < thresholds.length; i++) if (d <= thresholds[i]) return RAMP[i];
    return RAMP[5];
  };

  const codes = Object.keys(FRANCE_DEPT_PATHS);
  const nameByCode: Record<string, string> = {};
  for (const d of [...m.scarcest, ...m.densest]) nameByCode[d.code] = d.name;
  const active = hover ? m.byDept[hover.code] : null;

  return (
    <div>
      <div className="mb-5 flex items-center gap-3 flex-wrap">
        <label htmlFor="penurie-metier" className="text-sm text-[var(--text-secondary)]">Choisissez un métier :</label>
        <select
          id="penurie-metier"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="h-11 px-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] cursor-pointer"
        >
          {metiers.map((x) => (
            <option key={x.slug} value={x.slug}>{x.name}</option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Carte */}
        <div className="relative">
          <svg viewBox={FRANCE_MAP_VIEWBOX} className="w-full h-auto" role="img" aria-label={`Densité de ${m.name} par département`} onMouseLeave={() => setHover(null)}>
            {codes.map((code) => {
              const d = m.byDept[code];
              const fill = d === undefined ? "#E5E7EB" : colorFor(d);
              return (
                <path
                  key={code}
                  d={FRANCE_DEPT_PATHS[code]}
                  fill={fill}
                  stroke="#fff"
                  strokeWidth={hover?.code === code ? 2.2 : 0.7}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => { const b = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect(); setHover({ code, x: e.clientX - b.left, y: e.clientY - b.top }); }}
                  onMouseMove={(e) => { const b = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect(); setHover({ code, x: e.clientX - b.left, y: e.clientY - b.top }); }}
                />
              );
            })}
          </svg>
          {hover && active !== null && active !== undefined && (
            <div className="pointer-events-none absolute z-10 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 shadow-md text-sm" style={{ left: Math.min(hover.x + 12, 220), top: Math.max(hover.y - 10, 0) }}>
              <div className="font-semibold text-[var(--text-primary)]">{nameByCode[hover.code] || hover.code}</div>
              <div className="text-[var(--text-secondary)]"><span className="font-semibold text-[var(--accent)]">{dec(active)}</span> {m.name.toLowerCase()} / 10k hab</div>
            </div>
          )}
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">Plus c&apos;est pâle, moins il y a de {m.name.toLowerCase()} par habitant. Densité moyenne France : {dec(m.avgDensity)} / 10 000 hab.</p>
        </div>

        {/* Classements */}
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">Où il en manque le plus</p>
            <ul className="space-y-2">
              {m.scarcest.map((d) => (
                <li key={d.code} className="flex items-center justify-between gap-3">
                  <Link href={`/${m.slug}/${deptSlug(d.name, d.code)}`} className="text-sm text-[var(--text-primary)] hover:text-[var(--accent)]">{d.name}</Link>
                  <span className="text-sm font-semibold text-[var(--text-secondary)]">{dec(d.density)} / 10k</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">Où il y en a le plus</p>
            <ul className="space-y-2">
              {m.densest.map((d) => (
                <li key={d.code} className="flex items-center justify-between gap-3">
                  <Link href={`/${m.slug}/${deptSlug(d.name, d.code)}`} className="text-sm text-[var(--text-primary)] hover:text-[var(--accent)]">{d.name}</Link>
                  <span className="text-sm font-semibold text-[var(--accent)]">{dec(d.density)} / 10k</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
