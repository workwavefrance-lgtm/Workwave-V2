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
  | "amsterdam";

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
