"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// useLayoutEffect côté client (avant le paint), useEffect côté serveur (no-op)
// → évite le warning SSR tout en supprimant le flash de la valeur finale.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type CountUpProps = {
  end: number;
  duration?: number;
  suffix?: string;
  className?: string;
};

// Formatage déterministe (espace tous les 3 chiffres), IDENTIQUE serveur/client.
// On n'utilise PAS toLocaleString : son caractère d'espace (fine insécable vs
// normale) peut différer entre l'ICU de Node et celui du navigateur → mismatch
// d'hydratation. Ici, espace ASCII normal, garanti identique des deux côtés.
function formatFr(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export default function CountUp({
  end,
  duration = 2000,
  suffix = "",
  className = "",
}: CountUpProps) {
  // Initial = end : le HTML rendu côté serveur contient la VRAIE valeur
  // (SEO, crawlers sans JS, LCP). L'hydratation matche (client initial = end).
  const [count, setCount] = useState(end);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  // Avant le 1er paint client : si on va animer, on remet à 0 SANS flash visible
  // (la valeur SSR `end` n'apparaît jamais à l'écran côté client, mais reste
  // dans le HTML source pour le SEO). Respecte prefers-reduced-motion.
  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!reduced) setCount(0);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setCount(end);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          observer.disconnect();
          const startTime = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(end);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref} className={className}>
      {formatFr(count)}
      {suffix}
    </span>
  );
}
