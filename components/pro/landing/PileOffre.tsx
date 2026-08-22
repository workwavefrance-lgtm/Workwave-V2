"use client";

import { useEffect, useRef, useState } from "react";

export type LigneOffre = {
  titre: string;
  detail: string;
  valeur: string;
  souligne?: boolean;
};

/**
 * Liste de ce qui est compris dans l'offre. Chaque ligne entre par la gauche,
 * l'une apres l'autre, avec un filet coral qui se dessine sur son bord et la
 * valeur qui apparait en rebond juste apres.
 */
export default function PileOffre({ lignes }: { lignes: LigneOffre[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const [entrees, setEntrees] = useState<boolean[]>(() => lignes.map(() => false));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const doux = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (doux) {
      setEntrees(lignes.map(() => true));
      return;
    }

    const minuteries: ReturnType<typeof setTimeout>[] = [];
    const tout = () => setEntrees(lignes.map(() => true));
    // Filet : si l'observateur ne se declenche jamais (onglet en arriere-plan,
    // navigateur exotique, extension), le contenu apparait quand meme.
    minuteries.push(setTimeout(tout, 3000));
    const obs = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          if (!e.isIntersecting) continue;
          obs.disconnect();
          lignes.forEach((_, i) => {
            minuteries.push(
              setTimeout(() => {
                setEntrees((prec) => {
                  const suite = [...prec];
                  suite[i] = true;
                  return suite;
                });
              }, i * 110)
            );
          });
        }
      },
      { threshold: 0.18 }
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      for (const m of minuteries) clearTimeout(m);
    };
  }, [lignes]);

  return (
    <>
      {/* Sans JavaScript, les lignes ne doivent pas rester invisibles. */}
      <noscript>
        <style>{".pile-ligne{opacity:1 !important;transform:none !important}"}</style>
      </noscript>
    <ul
      ref={ref}
      className="list-none p-0 m-0 border border-[var(--border-color)] rounded-2xl overflow-hidden"
    >
      {lignes.map((l, i) => (
        <li
          key={l.titre}
          className={`pile-ligne relative overflow-hidden grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-5 items-center px-6 py-5 border-t border-[var(--border-color)] first:border-t-0 transition-[opacity,transform] duration-[600ms] ease-out ${
            l.souligne ? "bg-[var(--accent-muted)]" : "bg-[var(--bg-primary)]"
          } ${entrees[i] ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"}`}
        >
          <span
            aria-hidden="true"
            className={`absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--accent)] origin-top transition-transform duration-500 delay-100 ease-out ${
              entrees[i] ? "scale-y-100" : "scale-y-0"
            }`}
          />
          <div>
            <b className="block font-semibold text-base text-[var(--text-primary)] mb-0.5">
              {l.titre}
            </b>
            <span className="block text-sm text-[var(--text-secondary)] leading-relaxed">
              {l.detail}
            </span>
          </div>
          <em
            className={`not-italic font-bold text-[15px] whitespace-nowrap transition-[opacity,transform] duration-[450ms] delay-200 ${
              l.souligne ? "text-[var(--accent)]" : "text-emerald-600 dark:text-emerald-400"
            } ${entrees[i] ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
          >
            {l.valeur}
          </em>
        </li>
      ))}
    </ul>
    </>
  );
}
