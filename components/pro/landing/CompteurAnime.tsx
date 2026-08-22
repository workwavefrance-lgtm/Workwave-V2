"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Nombre qui se compte de zero jusqu'a sa valeur quand il entre a l'ecran.
 * Respecte prefers-reduced-motion : dans ce cas la valeur finale s'affiche
 * directement, sans animation.
 */
export default function CompteurAnime({
  valeur,
  suffixe = "",
  duree = 1200,
  className,
}: {
  valeur: number;
  suffixe?: string;
  duree?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // Valeur finale des le rendu serveur : sans JavaScript, ou si l'observateur
  // ne se declenche jamais, le nombre reste juste. L'animation ne fait que
  // repartir de zero au moment ou il entre a l'ecran.
  const [affiche, setAffiche] = useState(valeur);
  const lance = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const obs = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (!e.isIntersecting || lance.current) continue;
          lance.current = true;
          obs.disconnect();
          const debut = performance.now();
          const pas = (t: number) => {
            const p = Math.min((t - debut) / duree, 1);
            setAffiche(Math.round(valeur * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(pas);
          };
          requestAnimationFrame(pas);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [valeur, duree]);

  return (
    <span ref={ref} className={className}>
      {affiche.toLocaleString("fr-FR")}
      {suffixe}
    </span>
  );
}
