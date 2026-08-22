"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Une annee de douze mois, vue des deux cotes. Les deux lignes sont a la
 * MEME echelle en euros : un abonnement mensuel ecrase visuellement un
 * paiement au contact, et c'est precisement ce que le bloc doit montrer.
 *
 * L'abonnement retenu (186 EUR / mois) est la borne la plus BASSE de ce que
 * les artisans declarent payer (releve du 22 aout 2026, six sources).
 */
const ABONNEMENT_MENSUEL = 186;
const CONTACTS_PAR_MOIS = [4, 3, 0, 0, 2, 4, 5, 4, 3, 3, 2, 0];
const PRIX_CONTACT = 9.9;

export default function BarresAnnee() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          if (!e.isIntersecting) continue;
          obs.disconnect();
          setVisible(true);
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    // Filet : si l'observateur ne se declenche jamais, les barres montent
    // quand meme au bout de 3 secondes plutot que de rester a zero.
    const filet = setTimeout(() => setVisible(true), 3000);
    return () => {
      obs.disconnect();
      clearTimeout(filet);
    };
  }, []);

  const hauteur = (montant: number) =>
    montant === 0 ? 6 : Math.max(14, Math.round((montant / ABONNEMENT_MENSUEL) * 100));

  return (
    <div
      ref={ref}
      className="border border-[var(--border-color)] rounded-[22px] overflow-hidden"
    >
      {/* Sans JavaScript, les barres ne doivent pas rester a hauteur zero. */}
      <noscript>
        <style>{".barre-annee{height:var(--h) !important}"}</style>
      </noscript>
      <Ligne
        nom="Abonnement mensuel"
        detail="186 € par mois, la borne basse de ce que les artisans déclarent payer"
        total="2 232 €"
        montants={Array(12).fill(ABONNEMENT_MENSUEL)}
        hauteur={hauteur}
        visible={visible}
      />
      <Ligne
        nous
        nom="Workwave.fr"
        detail="9,90 € le contact, quand vous en prenez un"
        total="297 €"
        montants={CONTACTS_PAR_MOIS.map((n) => n * PRIX_CONTACT)}
        hauteur={hauteur}
        visible={visible}
      />
    </div>
  );
}

function Ligne({
  nom,
  detail,
  total,
  montants,
  hauteur,
  visible,
  nous = false,
}: {
  nom: string;
  detail: string;
  total: string;
  montants: number[];
  hauteur: (m: number) => number;
  visible: boolean;
  nous?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-[236px_1fr_118px] gap-4 lg:gap-6 items-center px-6 py-6 border-t border-[var(--border-color)] first:border-t-0 ${
        nous ? "bg-[var(--accent-muted)]" : ""
      }`}
    >
      <div>
        <b className="block font-semibold text-base text-[var(--text-primary)]">{nom}</b>
        <span className="block text-[13px] text-[var(--text-secondary)] mt-0.5 leading-snug">
          {detail}
        </span>
      </div>
      <div className="grid grid-cols-12 gap-[5px] items-end h-16">
        {montants.map((m, i) => (
          <i
            key={i}
            style={
              {
                height: visible ? `${hauteur(m)}%` : "0%",
                transitionDelay: `${i * 45}ms`,
                "--h": `${hauteur(m)}%`,
              } as React.CSSProperties
            }
            className={`barre-annee block rounded transition-[height] duration-[800ms] ease-out ${
              m === 0
                ? "bg-[var(--border-color)]"
                : nous
                  ? "bg-[var(--accent)]"
                  : "bg-[var(--text-tertiary)]"
            }`}
          />
        ))}
      </div>
      <div>
        <b
          className={`block text-[27px] font-extrabold tracking-tight tabular-nums ${
            nous ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
          }`}
        >
          {total}
        </b>
        <span className="block text-[12.5px] text-[var(--text-secondary)]">sur l&apos;année</span>
      </div>
    </div>
  );
}
