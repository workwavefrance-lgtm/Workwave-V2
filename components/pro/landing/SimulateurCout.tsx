"use client";

import { useState } from "react";

/**
 * Curseur qui compare une annee de clients appeles.
 *
 * Bornes voulues : 1 a 20 clients par mois. Au-dela de 20, notre cout depasse
 * la borne basse de l'abonnement et l'argument se retourne ; 20 est deja un
 * rythme eleve pour un artisan seul.
 *
 * Tarifs concurrents releves le 22 aout 2026, six sources par plateforme.
 * Habitatpresto : 186 a 372 EUR / mois declares. Travaux.com : 20 a 80 EUR le
 * contact constate (le "a partir de 1 EUR" affiche est un tarif de tete de
 * gondole que les artisans ne rencontrent pas).
 */
const PRIX = 9.9;
const OFFERTS = 2;
const ABO_MIN = 186;
const ABO_MAX = 372;
const TC_MIN = 20;
const TC_MAX = 80;

const euros = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const entier = (n: number) => Math.round(n).toLocaleString("fr-FR") + " €";

export default function SimulateurCout() {
  const [n, setN] = useState(6);
  const payants = Math.max(0, n - OFFERTS);
  const nousMois = payants * PRIX;

  return (
    <>
      <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl px-7 py-6 mb-6">
        <div className="flex flex-wrap justify-between items-baseline gap-4 mb-4">
          <label htmlFor="curseur-cout" className="text-[15px] text-[var(--text-secondary)]">
            Clients appelés dans le mois
          </label>
          <b className="text-[32px] font-extrabold tracking-tight tabular-nums text-[var(--accent)]">
            {n}
          </b>
        </div>
        <input
          id="curseur-cout"
          type="range"
          min={1}
          max={20}
          step={1}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="w-full accent-[var(--accent)] cursor-pointer"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Carte
          nous
          nom="Workwave.fr"
          modele="9,90 € le contact. Les 2 premiers offerts."
          montant={payants === 0 ? "0 €" : euros(nousMois)}
          unite={
            payants === 0 ? "vos 2 premiers sont offerts" : `pour ${n} contacts, 2 offerts`
          }
          source="Prix unique, identique dans tous les métiers et toutes les zones, toute l'année."
        />
        <Carte
          nom="Habitatpresto"
          modele="Abonnement mensuel, 6 à 12 mois d'engagement."
          montant={`${ABO_MIN} à ${ABO_MAX} €`}
          unite="par mois, que vous ayez des chantiers ou non"
          source="Relevé le 22 août 2026, montants déclarés par les artisans. 1 116 € minimum avant votre premier chantier."
        />
        <Carte
          nom="Travaux.com"
          modele="Achat de contacts, prix variable selon le chantier."
          montant={`${entier(n * TC_MIN)} à ${entier(n * TC_MAX)}`}
          unite={`pour ${n} contacts, de ${TC_MIN} à ${TC_MAX} € pièce`}
          source="Relevé le 22 août 2026. Le prix suit la taille du chantier : les plus gros sont ceux qui coûtent 80 €."
        />
      </div>

      <p className="mt-6 bg-[var(--accent)] text-white rounded-[18px] px-6 py-5 text-[17px] font-semibold text-center leading-relaxed">
        Sur un an, vous payez <b className="text-[25px] tabular-nums">{entier(nousMois * 12)}</b>.
        Le même artisan sort{" "}
        <b className="tabular-nums">
          {entier(ABO_MIN * 12)} à {entier(ABO_MAX * 12)}
        </b>{" "}
        chez Habitatpresto, et{" "}
        <b className="tabular-nums">
          {entier(n * TC_MIN * 12)} à {entier(n * TC_MAX * 12)}
        </b>{" "}
        chez Travaux.com.
      </p>
    </>
  );
}

function Carte({
  nom,
  modele,
  montant,
  unite,
  source,
  nous = false,
}: {
  nom: string;
  modele: string;
  montant: string;
  unite: string;
  source: string;
  nous?: boolean;
}) {
  return (
    <div
      className={`rounded-[18px] border px-6 py-5 ${
        nous
          ? "border-[var(--accent)] bg-[var(--accent-muted)]"
          : "border-[var(--border-color)] bg-[var(--bg-primary)]"
      }`}
    >
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-0.5">{nom}</h3>
      <p className="text-[12.5px] text-[var(--text-secondary)] mb-4 min-h-[2.4em] leading-snug">
        {modele}
      </p>
      <div
        className={`text-[33px] font-extrabold tracking-tight tabular-nums ${
          nous ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
        }`}
      >
        {montant}
      </div>
      <div className="text-[13px] text-[var(--text-secondary)] mt-1">{unite}</div>
      <div className="text-[11px] text-[var(--text-tertiary)] mt-3.5 pt-3 border-t border-[var(--border-color)] leading-relaxed">
        {source}
      </div>
    </div>
  );
}
