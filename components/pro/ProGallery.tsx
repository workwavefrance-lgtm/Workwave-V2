"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

export type PhotoRealisation = {
  url: string;
  legende: string | null;
  /** Vrai si le pro a lui-meme envoye cette photo. Faux pour les photos
   *  d'enrichissement Google Places, dont l'auteur nous est inconnu. */
  duPro: boolean;
};

/**
 * Bande defilante des realisations d'un pro, avec agrandissement au clic.
 *
 * Pourquoi une bande et pas une grille (mesure du 21/08/2026) : sur seize
 * photos reelles de trois artisans, TREIZE sont en portrait et la plus etroite
 * fait 720x1560. L'ancienne grille les recadrait au carre, ce qui coupait les
 * cimes d'arbres et les faitages. Une bande a hauteur fixe preserve les
 * proportions d'origine, et elle tient avec UNE photo comme avec DIX : sept de
 * nos dix-sept pros equipes n'en ont qu'une seule, ce qui elimine toute mise
 * en page en grille sans cas particulier.
 *
 * Cout sur les fiches sans photo : NUL. Le composant n'est rendu que si
 * `photos.length > 0`, donc son morceau de code n'est meme pas telecharge sur
 * les 2,4 millions de fiches qui n'en ont pas.
 *
 * La hauteur est FIXE (260 px) : la largeur s'ajuste au ratio de chaque image,
 * donc aucun decalage VERTICAL de la page pendant le chargement. Le leger
 * ajustement horizontal se produit a l'interieur du conteneur qui defile et
 * ne bouge pas le reste de la page.
 */
export default function ProGallery({
  photos,
  nomPro,
  metier,
  ville,
  departement,
}: {
  photos: PhotoRealisation[];
  nomPro: string;
  metier: string | null;
  ville: string | null;
  departement: string | null;
}) {
  const [ouverte, setOuverte] = useState<number | null>(null);
  const dialogue = useRef<HTMLDialogElement>(null);

  // Texte alternatif : la legende du pro d'abord, puis le contexte. C'est le
  // seul texte de la fiche que personne d'autre ne possede, et c'est ce que
  // Google Images lit.
  // Le texte alternatif ne revendique un AUTEUR que pour les photos que le
  // pro a lui-meme envoyees. Mesure du 21/08/2026 : sur 724 photos en base,
  // 665 viennent de Google Places, deposees le plus souvent par des CLIENTS,
  // sur 182 fiches dont aucune n'est reclamee. Ecrire "chantier realise par"
  // sur ces photos serait une affirmation d'auteur fausse, servie a Google.
  const texteAlternatif = (p: PhotoRealisation, i: number) => {
    const lieu = ville ? ` à ${ville}${departement ? ` (${departement})` : ""}` : "";
    if (!p.duPro) {
      return `${nomPro}, ${metier || "professionnel"}${lieu}, photo ${i + 1}`;
    }
    const contexte = `Chantier de ${metier || "professionnel"} réalisé par ${nomPro}${lieu}`;
    return p.legende ? `${p.legende}. ${contexte}` : `${contexte}, photo ${i + 1}`;
  };

  const bouger = useCallback(
    (pas: number) =>
      setOuverte((i) => (i === null ? null : (i + pas + photos.length) % photos.length)),
    [photos.length]
  );

  // <dialog> natif : il apporte le piege a focus, la fermeture par Echap et le
  // fond inerte sans une ligne de JavaScript. On ne gere donc a la main que
  // les fleches.
  useEffect(() => {
    const d = dialogue.current;
    if (!d) return;
    if (ouverte !== null && !d.open) d.showModal();
    if (ouverte === null && d.open) d.close();
  }, [ouverte]);

  useEffect(() => {
    if (ouverte === null) return;
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") bouger(-1);
      if (e.key === "ArrowRight") bouger(1);
      // Echap est gere EXPLICITEMENT et pas seulement laisse au <dialog>
      // natif : lors de la verification du 21/08/2026, une vraie frappe Echap
      // ne fermait pas la modale. Plutot que de dependre du comportement natif
      // et de son declenchement de l'evenement `close`, on ferme nous-memes.
      // Si le navigateur ferme aussi de son cote, `onClose` remet le meme
      // etat a null : l'operation est sans effet de bord.
      if (e.key === "Escape") setOuverte(null);
    };
    window.addEventListener("keydown", auClavier);
    return () => window.removeEventListener("keydown", auClavier);
  }, [ouverte, bouger]);

  const active = ouverte !== null ? photos[ouverte] : null;

  return (
    <>
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:thin]">
          {/* Aucune max-width sur les figures : elle recadrait les photos
              PAYSAGE, exactement le defaut que cette refonte visait a
              supprimer. A 260 px de haut, une photo en 16/9 fait 462 px de
              large, ce qui reste raisonnable dans une bande qui defile. */}
          {photos.map((p, i) => (
            <figure key={p.url} className="m-0 shrink-0 snap-start">
              <button
                type="button"
                onClick={() => setOuverte(i)}
                aria-label={`Agrandir : ${p.legende || `photo ${i + 1}`}`}
                className="block rounded-2xl overflow-hidden border border-[var(--card-border)] leading-none transition-transform duration-250 ease-out hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <Image
                  src={p.url}
                  alt={texteAlternatif(p, i)}
                  width={520}
                  height={390}
                  /* Fourchette REELLE des largeurs rendues : a hauteur
                     fixe, une photo portrait fait environ 120 px de large et
                     une photo 16/9 environ 460 px. Declarer 70vw faisait
                     demander des images de 640 px pour des vignettes de
                     150 px, soit de l'octet paye pour rien sous le crawl. */
                  sizes="(max-width: 640px) 45vw, 460px"
                  className="h-[220px] sm:h-[260px] w-auto object-cover"
                />
              </button>
              {p.legende && (
                <figcaption className="text-[13px] text-[var(--text-secondary)] leading-snug mt-2 px-0.5">
                  {p.legende}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>

      <dialog
        ref={dialogue}
        onClose={() => setOuverte(null)}
        aria-label="Photo agrandie"
        className="backdrop:bg-black/90 bg-transparent p-0 m-0 max-w-none max-h-none w-full h-full"
      >
        {/* Le gestionnaire de fermeture est porte par le div ci-dessous et
            compare a currentTarget, PAS par le dialogue. Ce div le recouvre au
            pixel pres (w-full h-full sur un dialogue sans marge ni bordure),
            donc un vrai clic humain a toujours ce div pour cible et jamais le
            dialogue. Verification du 21/08/2026 : un test par element.click()
            passait, parce qu'un clic synthetique vise le dialogue ; un clic par
            coordonnees echouait. La sonde trompait le test. */}
        {active && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setOuverte(null);
            }}
            /* L'assombrissement est porte ICI et pas seulement par le
               pseudo-element ::backdrop : celui-ci vit dans la couche
               superieure du navigateur, ou son rendu depend du compositeur.
               Le porter sur le div garantit le fond sombre partout, et fait
               coincider la zone visiblement "hors photo" avec la zone qui
               ferme au clic. */
            className="w-full h-full bg-black/90 flex flex-col items-center justify-center gap-4 p-6"
          >
            {/* Passage par l'optimiseur d'images plutot que le fichier
                d'origine : une photo envoyee par un pro peut peser 5 Mo, et
                la servir telle quelle a chaque agrandissement gaspille la
                bande passante du visiteur comme la notre. `unoptimized` est
                volontairement absent. */}
            <Image
              src={active.url}
              alt={texteAlternatif(active, ouverte ?? 0)}
              width={1400}
              height={1400}
              sizes="(max-width: 640px) 92vw, 76vh"
              className="max-w-full max-h-[76vh] w-auto h-auto object-contain rounded-xl"
              priority
            />
            {active.legende && (
              <p className="text-white text-center text-[15px] leading-snug max-w-2xl">
                {active.legende}
              </p>
            )}
            <p className="text-white/70 font-mono text-xs">
              {(ouverte ?? 0) + 1} / {photos.length}
            </p>

            <button
              type="button"
              onClick={() => setOuverte(null)}
              className="absolute top-5 right-5 text-white text-sm bg-white/15 hover:bg-white/25 rounded-full px-4 py-2 transition-colors"
            >
              Fermer
            </button>
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => bouger(-1)}
                  aria-label="Photo précédente"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-2xl bg-white/15 hover:bg-white/25 w-11 h-11 rounded-full flex items-center justify-center transition-colors"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => bouger(1)}
                  aria-label="Photo suivante"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-2xl bg-white/15 hover:bg-white/25 w-11 h-11 rounded-full flex items-center justify-center transition-colors"
                >
                  ›
                </button>
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
