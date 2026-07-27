import Link from "next/link";

const PAGES = [
  { path: "/barometre-artisans", label: "Densité par département" },
  { path: "/barometre-prix-artisans", label: "Prix des artisans" },
  { path: "/barometre-metiers-artisans", label: "Métiers les plus répandus" },
];

/** Interconnexion des pages de l'Observatoire Workwave (cluster SEO). */
export default function ObservatoireNav({ current }: { current: string }) {
  const others = PAGES.filter((p) => p.path !== current);
  return (
    <section className="mb-14">
      <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">Les autres baromètres de l&apos;Observatoire Workwave</p>
      <div className="flex flex-wrap gap-3">
        {others.map((p) => (
          <Link
            key={p.path}
            href={p.path}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--bg-secondary)] px-5 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-250"
          >
            {p.label} <span aria-hidden>→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
