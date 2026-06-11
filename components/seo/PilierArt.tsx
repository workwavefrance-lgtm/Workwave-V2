/**
 * Illustrations line-art des pages pilier SEO (/[metier]/urgence,
 * /[metier]/obligation, /[metier]/installation).
 *
 * Style commun (cf. MonumentArt) : traits fins stroke 1.6, currentColor pour
 * la structure, var(--accent) pour l'élément signature. Toutes décoratives
 * (aria-hidden).
 */

/** Porte + clé (serrurier). L'élément signature accent : la clé. */
export function DoorKeyArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 210"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* cadre de porte */}
      <rect x="44" y="18" width="100" height="174" rx="8" />
      {/* panneau de porte */}
      <rect x="57" y="31" width="74" height="161" rx="4" />
      {/* moulures */}
      <rect x="68" y="44" width="52" height="40" rx="3" opacity="0.5" />
      <rect x="68" y="132" width="52" height="46" rx="3" opacity="0.5" />
      {/* poignée */}
      <circle cx="121" cy="110" r="3.2" fill="currentColor" stroke="none" />
      {/* trou de serrure */}
      <circle cx="94" cy="104" r="7" />
      <path d="M94 110 L94 122" />
      {/* clé — accent coral */}
      <g stroke="var(--accent)" strokeWidth={1.8}>
        <circle cx="170" cy="142" r="13" />
        <circle cx="170" cy="142" r="5.5" opacity="0.6" />
        <path d="M179 152 L203 178" />
        <path d="M194 168 L187 175" />
        <path d="M203 178 L196 185" />
      </g>
      {/* traits d'urgence */}
      <g stroke="var(--accent)" strokeWidth={1.6} opacity="0.7">
        <path d="M168 36 L180 24" />
        <path d="M178 52 L192 46" />
        <path d="M160 26 L164 16" />
      </g>
    </svg>
  );
}

/** Radiateur + flamme (chauffagiste). L'élément signature accent : la flamme. */
export function FlameRadiatorArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 210"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* corps du radiateur */}
      <rect x="34" y="72" width="120" height="100" rx="10" />
      {/* éléments verticaux */}
      <rect x="46" y="84" width="14" height="76" rx="7" opacity="0.6" />
      <rect x="68" y="84" width="14" height="76" rx="7" opacity="0.6" />
      <rect x="90" y="84" width="14" height="76" rx="7" opacity="0.6" />
      <rect x="112" y="84" width="14" height="76" rx="7" opacity="0.6" />
      <rect x="134" y="84" width="14" height="76" rx="7" opacity="0.6" />
      {/* pieds */}
      <path d="M52 172 L52 186" />
      <path d="M136 172 L136 186" />
      {/* tuyau + robinet thermostatique */}
      <path d="M154 152 H176 V186" />
      <circle cx="176" cy="142" r="6" />
      <path d="M176 148 L176 152" />
      {/* flamme — accent coral */}
      <g stroke="var(--accent)" strokeWidth={1.8}>
        <path d="M94 50 C82 38 88 22 100 12 C98 24 108 26 110 36 C118 28 120 22 118 14 C130 24 134 40 124 52 C116 61 100 60 94 50 Z" />
        <path d="M104 50 C100 45 102 38 108 33 C107 39 113 41 112 47 C110 52 106 53 104 50 Z" opacity="0.6" />
      </g>
      {/* ondes de chaleur */}
      <g stroke="var(--accent)" strokeWidth={1.6} opacity="0.7">
        <path d="M170 70 C174 64 170 58 174 52" />
        <path d="M186 76 C190 70 186 64 190 58" />
        <path d="M200 96 C204 90 200 84 204 78" />
      </g>
    </svg>
  );
}

/** Toit + cheminée + hérisson (ramoneur). L'élément signature accent : le hérisson. */
export function ChimneyArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 210"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* pan de toit */}
      <path d="M12 168 L110 84 L208 168" />
      <path d="M26 168 L110 96 L194 168" opacity="0.5" />
      {/* tuiles suggérées */}
      <path d="M64 132 L84 148" opacity="0.4" />
      <path d="M96 106 L116 122" opacity="0.4" />
      <path d="M130 124 L150 140" opacity="0.4" />
      {/* souche de cheminée */}
      <path d="M134 64 V110" />
      <path d="M166 64 V136" />
      <rect x="128" y="52" width="44" height="12" rx="2" />
      {/* briques suggérées */}
      <path d="M150 76 H166" opacity="0.4" />
      <path d="M134 94 H150" opacity="0.4" />
      {/* hérisson de ramonage — accent coral */}
      <g stroke="var(--accent)" strokeWidth={1.8}>
        <circle cx="150" cy="34" r="11" />
        <path d="M150 23 L150 12" opacity="0.8" />
        <path d="M142 26 L134 18" opacity="0.8" />
        <path d="M158 26 L166 18" opacity="0.8" />
        <path d="M139 34 L128 34" opacity="0.8" />
        <path d="M161 34 L172 34" opacity="0.8" />
        <path d="M150 45 L150 52" />
      </g>
      {/* volutes de fumée */}
      <g stroke="var(--accent)" strokeWidth={1.6} opacity="0.6">
        <path d="M186 44 C192 38 186 32 192 26" />
        <path d="M200 56 C206 50 200 44 206 38" />
      </g>
    </svg>
  );
}

/** Unité murale + flux d'air + unité extérieure (climatisation). */
export function AcUnitArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 210"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* unité murale intérieure */}
      <rect x="30" y="30" width="130" height="46" rx="12" />
      <path d="M42 62 H148" opacity="0.5" />
      <path d="M46 68 H144" opacity="0.4" />
      <circle cx="146" cy="44" r="3" opacity="0.5" />
      {/* flux d'air — accent coral */}
      <g stroke="var(--accent)" strokeWidth={1.8}>
        <path d="M56 88 C50 100 58 108 52 120" />
        <path d="M86 88 C80 102 88 112 82 126" />
        <path d="M116 88 C110 100 118 108 112 120" />
      </g>
      {/* unité extérieure */}
      <rect x="128" y="128" width="74" height="58" rx="8" />
      <circle cx="158" cy="157" r="18" />
      <circle cx="158" cy="157" r="3" fill="currentColor" stroke="none" />
      {/* pales du ventilateur */}
      <path d="M158 142 C164 148 164 152 158 154" opacity="0.6" />
      <path d="M172 160 C165 163 161 161 160 156" opacity="0.6" />
      <path d="M146 165 C148 157 152 155 157 158" opacity="0.6" />
      {/* grille latérale */}
      <path d="M186 140 V174" opacity="0.5" />
      <path d="M192 140 V174" opacity="0.5" />
      {/* liaison frigorifique — accent */}
      <g stroke="var(--accent)" strokeWidth={1.6} opacity="0.7">
        <path d="M160 76 C170 92 180 104 182 126" />
      </g>
      {/* pieds */}
      <path d="M136 186 L136 194" />
      <path d="M194 186 L194 194" />
    </svg>
  );
}

/** Bouclier + coche line-art (confiance / vérification). Décoratif. */
export function ShieldCheckArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M32 6 L52 14 V30 C52 44 44 53 32 58 C20 53 12 44 12 30 V14 Z" />
      <path d="M23 31 L29.5 38 L42 24" stroke="var(--accent)" strokeWidth={2.2} />
    </svg>
  );
}
