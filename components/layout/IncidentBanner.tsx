"use client";

import { useState, useEffect } from "react";

/**
 * Bandeau d'excuses apres l'incident du 04/08/2026 (site indisponible plusieurs
 * heures : le conteneur applicatif a plante et Docker a cesse de le relancer).
 *
 * DEUX GARDE-FOUS VOLONTAIRES :
 *
 * 1. Il DISPARAIT TOUT SEUL a la date ci-dessous. Un message d'excuses qui traine
 *    trois mois apres la panne fait plus de mal que la panne elle-meme : il donne
 *    l'impression d'un site fragile a des visiteurs qui n'ont jamais rien vu.
 *    Ne pas repousser cette date "au cas ou" : la supprimer, elle et ce fichier.
 *
 * 2. Il n'annonce AUCUNE cause technique. Au moment de l'ecrire, la raison exacte
 *    du crash n'etait pas etablie. On ne publie pas une explication qu'on n'a pas
 *    verifiee : mieux vaut dire "une panne" que d'inventer un coupable.
 *
 * Pour le retirer avant l'echeance : supprimer <IncidentBanner /> de providers.tsx.
 */

// Fin d'affichage : 48 h apres l'incident.
const FIN = Date.parse("2026-08-06T20:00:00Z");
const CLE = "incident_2026_08_04_vu";

export default function IncidentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Date.now() > FIN) return;
    try {
      if (localStorage.getItem(CLE) === "1") return;
    } catch {
      /* navigation privee : on affiche, tant pis pour la memoire du choix */
    }
    setVisible(true);
  }, []);

  function fermer() {
    try {
      localStorage.setItem(CLE, "1");
    } catch {
      /* pas de stockage disponible : le bandeau reviendra au prochain chargement */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="status"
      className="relative z-40 border-b border-[#E5E7EB] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#111111]"
    >
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: "#FF5A36" }}
        />
        <p className="flex-1 text-[13px] leading-relaxed text-[#0A0A0A] dark:text-[#FAFAFA]">
          <strong className="font-semibold">Le site a été indisponible plusieurs heures aujourd&apos;hui.</strong>{" "}
          <span className="text-[#6B7280] dark:text-[#9CA3AF]">
            Si vous avez essayé de déposer un projet ou d&apos;accéder à votre espace
            professionnel sans y parvenir, le problème venait de nous. Tout refonctionne.
            Merci de réessayer, et désolé pour le temps perdu. - Willy
          </span>
        </p>
        <button
          onClick={fermer}
          aria-label="Fermer ce message"
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium cursor-pointer text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#0A0A0A] dark:hover:text-[#FAFAFA]"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
