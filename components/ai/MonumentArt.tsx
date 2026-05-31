import type { CSSProperties, ReactNode } from "react";

/**
 * MonumentArt — line-art minimaliste de skylines / monuments pour Workwave AI
 * international.
 *
 * Cahier des charges (valide Willy) :
 *   - Trait fin, silhouette epuree (PAS de photo generique — interdit charte §8 bis).
 *   - Couleur via `currentColor` : on peint en accent coral OU en filigrane noir
 *     selon le contexte (juste `className="text-[var(--ai-accent)]/20"` etc.).
 *   - SVG inline => leger, zero requete reseau, zero CLS (ratio fige par viewBox).
 *   - Coherent avec le design peec.ai noir/orange du vertical AI.
 *
 * Server-component safe (aucun hook). Decoratif par defaut (aria-hidden).
 *
 * Les proprietes stroke/fill sont posees sur le <svg> racine et HERITEES par
 * tous les paths/circles enfants (proprietes SVG heritables) — donc un seul
 * point de controle, pas d'attribut par element.
 */

export type MonumentName =
  | "skyline-global"
  | "skyline"
  | "dubai"
  | "london"
  | "paris"
  | "berlin"
  | "riyadh"
  | "amsterdam"
  | "golden-gate"
  | "statue-liberty"
  | "space-needle"
  | "us-capitol"
  | "monaco";

type Monument = { viewBox: string; content: ReactNode };

const MONUMENTS: Record<MonumentName, Monument> = {
  // Montage international : Tour Eiffel + Big Ben + Burj Khalifa + buildings.
  "skyline-global": {
    viewBox: "0 0 480 200",
    content: (
      <>
        {/* Tour Eiffel (gauche) */}
        <path d="M40 200 C52 150 58 110 64 64" />
        <path d="M88 200 C76 150 70 110 64 64" />
        <path d="M64 64 V40" />
        <path d="M48 158 H80" />
        <path d="M54 120 H74" />
        {/* Buildings */}
        <path d="M96 200 V150 H112 V200" />
        {/* Big Ben */}
        <path d="M120 200 V92 H140 V200" />
        <path d="M118 92 H142" />
        <path d="M120 92 L130 70 L140 92" />
        <path d="M130 70 V62" />
        <circle cx="130" cy="108" r="6" />
        {/* Dome */}
        <path d="M196 200 V150 H226 V200" />
        <path d="M196 150 Q211 130 226 150" />
        <path d="M156 200 V140 H178 V200" />
        <path d="M238 200 V125 H262 V200" />
        {/* Burj Khalifa (dominant, droite) */}
        <path d="M280 200 V120 H288 V92 H296 V60 H304 V92 H312 V120 H320 V200" />
        <path d="M300 60 V30" />
        {/* Buildings droite */}
        <path d="M340 200 V145 H366 V200" />
        <path d="M392 200 V160 H420 V200" />
        <path d="M430 200 V135 H456 V200" />
        {/* Sol */}
        <path d="M0 200 H480" />
      </>
    ),
  },
  // Skyline generique (buildings de hauteurs variees).
  skyline: {
    viewBox: "0 0 320 160",
    content: (
      <>
        <path d="M10 160 V90 H46 V160" />
        <path d="M52 160 V60 H92 V160" />
        <path d="M98 160 V110 H128 V160" />
        <path d="M134 160 V40 H170 V160" />
        <path d="M152 40 V24" />
        <path d="M176 160 V100 H210 V160" />
        <path d="M216 160 V70 H252 V160" />
        <path d="M258 160 V120 H300 V160" />
        <path d="M0 160 H320" />
      </>
    ),
  },
  // Dubai — Burj Khalifa + tours voisines.
  dubai: {
    viewBox: "0 0 200 280",
    content: (
      <>
        <path d="M84 280 V150 H92 V110 H100 V70 H108 V110 H116 V150 H124 V280" />
        <path d="M104 70 V36" />
        <path d="M30 280 V180 H58 V280" />
        <path d="M150 280 V160 H178 V280" />
        <path d="M8 280 H192" />
      </>
    ),
  },
  // London — Big Ben (Elizabeth Tower) + aile du Parlement.
  london: {
    viewBox: "0 0 200 280",
    content: (
      <>
        <path d="M70 280 V90 H110 V280" />
        <path d="M66 90 H114" />
        <path d="M70 90 L90 56 L110 90" />
        <path d="M90 56 V44" />
        <circle cx="90" cy="118" r="12" />
        <path d="M120 280 V170 H188 V280" />
        <path d="M132 170 V280" />
        <path d="M148 170 V280" />
        <path d="M164 170 V280" />
        <path d="M8 280 H192" />
      </>
    ),
  },
  // Paris — Tour Eiffel.
  paris: {
    viewBox: "0 0 200 300",
    content: (
      <>
        <path d="M40 300 C70 200 84 140 100 80" />
        <path d="M160 300 C130 200 116 140 100 80" />
        <path d="M100 80 V44" />
        <path d="M58 210 H142" />
        <path d="M74 150 H126" />
        <path d="M76 210 Q100 188 124 210" />
        <path d="M10 300 H190" />
      </>
    ),
  },
  // Berlin — Porte de Brandebourg.
  berlin: {
    viewBox: "0 0 240 200",
    content: (
      <>
        <path d="M30 96 H210" />
        <path d="M30 84 H210" />
        <path d="M44 190 V96" />
        <path d="M76 190 V96" />
        <path d="M108 190 V96" />
        <path d="M140 190 V96" />
        <path d="M172 190 V96" />
        <path d="M204 190 V96" />
        <path d="M110 84 V70 H130 V84" />
        <path d="M24 190 H216" />
        <path d="M10 190 H230" />
      </>
    ),
  },
  // Riyadh — Kingdom Centre (ouverture en arche).
  riyadh: {
    viewBox: "0 0 200 300",
    content: (
      <>
        <path d="M72 300 V64" />
        <path d="M128 300 V64" />
        <path d="M72 64 Q100 104 128 64" />
        <path d="M72 64 C72 44 84 34 100 34" />
        <path d="M128 64 C128 44 116 34 100 34" />
        <path d="M14 300 H186" />
      </>
    ),
  },
  // Amsterdam — maisons de canal a pignons.
  amsterdam: {
    viewBox: "0 0 240 180",
    content: (
      <>
        <path d="M20 180 V64 H28 V56 H36 V48 H44 V56 H52 V64 H60 V180" />
        <path d="M64 180 V70 L84 50 L104 70 V180" />
        <path d="M108 180 V66 C108 52 116 46 128 46 C140 46 148 52 148 66 V180" />
        <path d="M152 180 V64 H160 V56 H168 V48 H176 V56 H184 V64 H192 V180" />
        <path d="M196 180 V72 L214 52 L232 72 V180" />
        <path d="M8 180 H232" />
      </>
    ),
  },
  // San Francisco — Golden Gate Bridge (2 pylones + cable suspendu + tablier).
  "golden-gate": {
    viewBox: "0 0 340 200",
    content: (
      <>
        {/* Tablier (route) */}
        <path d="M12 142 H328" />
        {/* Pylone gauche */}
        <path d="M88 142 V34" />
        <path d="M102 142 V34" />
        <path d="M86 58 H104" />
        <path d="M86 92 H104" />
        {/* Pylone droit */}
        <path d="M238 142 V34" />
        <path d="M252 142 V34" />
        <path d="M236 58 H254" />
        <path d="M236 92 H254" />
        {/* Cable principal : ancrage -> sommet pylone -> creux -> sommet -> ancrage */}
        <path d="M12 104 Q44 56 95 34" />
        <path d="M95 34 Q170 116 245 34" />
        <path d="M245 34 Q296 56 328 104" />
        {/* Suspentes verticales */}
        <path d="M50 84 V142" />
        <path d="M140 92 V142" />
        <path d="M170 110 V142" />
        <path d="M200 92 V142" />
        <path d="M290 84 V142" />
        {/* Ligne d'eau */}
        <path d="M0 178 H340" />
      </>
    ),
  },
  // New York — Statue de la Liberte (couronne + torche levee + robe + socle).
  "statue-liberty": {
    viewBox: "0 0 200 300",
    content: (
      <>
        {/* Bras leve + torche */}
        <path d="M110 150 L132 92" />
        <path d="M123 92 H141" />
        <path d="M127 92 L125 72 M132 92 L132 70 M137 92 L139 74" />
        {/* Tete */}
        <circle cx="98" cy="122" r="11" />
        {/* Couronne (pointes) */}
        <path d="M87 116 L82 103 M93 112 L91 98 M98 111 L98 96 M103 112 L105 98 M109 116 L114 103" />
        {/* Robe (corps) */}
        <path d="M88 132 L78 248" />
        <path d="M108 134 L120 248" />
        <path d="M78 248 H120" />
        {/* Tablette (bras gauche) */}
        <path d="M90 152 L72 170 L78 200" />
        {/* Socle / pedestal */}
        <path d="M64 300 V248 H134 V300" />
        <path d="M74 248 V228 H124 V248" />
        <path d="M20 300 H180" />
      </>
    ),
  },
  // Seattle — Space Needle (tripode + soucoupe + antenne).
  "space-needle": {
    viewBox: "0 0 200 300",
    content: (
      <>
        {/* Pieds (tripode) */}
        <path d="M66 300 C82 218 92 158 97 112" />
        <path d="M134 300 C118 218 108 158 103 112" />
        <path d="M100 300 V112" />
        {/* Soucoupe */}
        <path d="M60 112 Q100 90 140 112 Q100 132 60 112 Z" />
        {/* Anneau sous la soucoupe */}
        <path d="M70 120 Q100 134 130 120" />
        {/* Antenne */}
        <path d="M100 90 V54" />
        {/* Sol */}
        <path d="M22 300 H178" />
      </>
    ),
  },
  // Washington D.C. — Capitole (dome + colonnade).
  "us-capitol": {
    viewBox: "0 0 280 200",
    content: (
      <>
        {/* Corps / colonnade */}
        <path d="M22 190 V118 H258 V190" />
        <path d="M44 190 V118" />
        <path d="M68 190 V118" />
        <path d="M92 190 V118" />
        <path d="M188 190 V118" />
        <path d="M212 190 V118" />
        <path d="M236 190 V118" />
        {/* Bloc central sous le dome */}
        <path d="M112 118 V94 H168 V118" />
        {/* Tambour du dome */}
        <path d="M120 94 V82 H160 V94" />
        {/* Dome */}
        <path d="M120 82 Q140 34 160 82" />
        {/* Statue / lanterne au sommet */}
        <path d="M140 34 V20" />
        {/* Marches */}
        <path d="M10 190 H270" />
      </>
    ),
  },
  // Monaco — Casino de Monte-Carlo (facade Belle Epoque : deux tours a coupole
  // encadrant un pavillon central a dome, arcades cintrees). Hommage a la
  // principaute (Charles Garnier, 1879).
  monaco: {
    viewBox: "0 0 280 200",
    content: (
      <>
        {/* Corps principal de la facade */}
        <path d="M44 190 V126 H236 V190" />
        {/* Pavillon central + dome + fleuron */}
        <path d="M110 126 V96 H170 V126" />
        <path d="M110 96 Q140 66 170 96" />
        <path d="M140 66 V52" />
        {/* Tour gauche : corps + coupole + fleuron */}
        <path d="M56 126 V84 H88 V126" />
        <path d="M54 84 Q72 54 90 84" />
        <path d="M72 54 V40" />
        {/* Tour droite : corps + coupole + fleuron */}
        <path d="M192 126 V84 H224 V126" />
        <path d="M190 84 Q208 54 226 84" />
        <path d="M208 54 V40" />
        {/* Entree centrale cintree */}
        <path d="M124 190 V152 Q140 134 156 152 V190" />
        {/* Arcades laterales cintrees */}
        <path d="M90 190 V158 Q98 146 106 158 V190" />
        <path d="M174 190 V158 Q182 146 190 158 V190" />
        {/* Fenetres cintrees a la base des tours */}
        <path d="M64 126 V108 Q72 100 80 108 V126" />
        <path d="M200 126 V108 Q208 100 216 108 V126" />
        {/* Sol / terrasse */}
        <path d="M12 190 H268" />
      </>
    ),
  },
};

type MonumentArtProps = {
  name: MonumentName;
  className?: string;
  style?: CSSProperties;
  /** Epaisseur du trait (defaut fin : 1.5). */
  strokeWidth?: number;
  /** Decoratif par defaut. Passer un title + decorative=false pour le rendre semantique. */
  title?: string;
  decorative?: boolean;
};

export default function MonumentArt({
  name,
  className,
  style,
  strokeWidth = 1.5,
  title,
  decorative = true,
}: MonumentArtProps) {
  const monument = MONUMENTS[name];
  if (!monument) return null;

  return (
    <svg
      viewBox={monument.viewBox}
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      preserveAspectRatio="xMidYMax meet"
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={!decorative ? title : undefined}
    >
      {!decorative && title ? <title>{title}</title> : null}
      {monument.content}
    </svg>
  );
}
