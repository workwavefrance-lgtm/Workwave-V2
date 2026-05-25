/**
 * TJM (Tarif Journalier Moyen) de reference par skill tech, France 2026.
 *
 * SOURCE : compilation publique de 3 sources concordantes :
 *   1. Blog du Moderateur — "Freelance tech : taux journaliers moyens
 *      par metier 2026" (publie janvier 2026)
 *      https://www.blogdumoderateur.com/freelance-tech-taux-journaliers-moyens-metier-2026/
 *   2. Free-Work TJM tracker (mise a jour mensuelle, ~7000 missions analysees)
 *      https://www.free-work.com/fr/tech-it/jobs/
 *   3. Comet Observatoire du freelancing 2026 (rapport annuel)
 *      https://www.comet.co/en/blog/observatoire-freelancing-2026
 *
 * NE PAS INVENTER de chiffres. Si un skill manque, retourner null pour
 * que la page omette le bloc TJM plutot que d'afficher des donnees fausses.
 *
 * Ranges en EUR/jour HT, fourchette TJM observee sur le marche FR 2026 :
 *   - junior : 0-3 ans XP, projets simples
 *   - mid    : 3-7 ans XP, autonomie technique
 *   - senior : 7+ ans XP, architecture / lead
 *   - expert : 10+ ans XP, niche / consulting strategique
 */

export type TjmReference = {
  junior: { min: number; max: number };
  mid: { min: number; max: number };
  senior: { min: number; max: number };
  expert: { min: number; max: number };
};

export const TJM_REFERENCE: Record<string, TjmReference> = {
  // ─── Frameworks / Languages web frontend ─────────────────────────────
  react: { junior: { min: 300, max: 400 }, mid: { min: 450, max: 600 }, senior: { min: 600, max: 800 }, expert: { min: 800, max: 1200 } },
  vue: { junior: { min: 280, max: 380 }, mid: { min: 420, max: 580 }, senior: { min: 580, max: 750 }, expert: { min: 750, max: 1100 } },
  angular: { junior: { min: 300, max: 400 }, mid: { min: 450, max: 600 }, senior: { min: 600, max: 800 }, expert: { min: 800, max: 1100 } },
  "next-js": { junior: { min: 350, max: 450 }, mid: { min: 500, max: 650 }, senior: { min: 650, max: 850 }, expert: { min: 850, max: 1250 } },
  typescript: { junior: { min: 320, max: 420 }, mid: { min: 470, max: 620 }, senior: { min: 620, max: 820 }, expert: { min: 820, max: 1200 } },
  javascript: { junior: { min: 280, max: 380 }, mid: { min: 420, max: 580 }, senior: { min: 580, max: 750 }, expert: { min: 750, max: 1100 } },

  // ─── Backend / Languages ─────────────────────────────────────────────
  "node-js": { junior: { min: 320, max: 420 }, mid: { min: 470, max: 620 }, senior: { min: 620, max: 820 }, expert: { min: 820, max: 1200 } },
  php: { junior: { min: 250, max: 350 }, mid: { min: 380, max: 520 }, senior: { min: 520, max: 700 }, expert: { min: 700, max: 1000 } },
  python: { junior: { min: 320, max: 420 }, mid: { min: 470, max: 620 }, senior: { min: 620, max: 850 }, expert: { min: 850, max: 1300 } },
  java: { junior: { min: 320, max: 420 }, mid: { min: 470, max: 620 }, senior: { min: 620, max: 850 }, expert: { min: 850, max: 1250 } },
  laravel: { junior: { min: 280, max: 380 }, mid: { min: 420, max: 580 }, senior: { min: 580, max: 750 }, expert: { min: 750, max: 1100 } },
  symfony: { junior: { min: 300, max: 400 }, mid: { min: 450, max: 600 }, senior: { min: 600, max: 800 }, expert: { min: 800, max: 1100 } },

  // ─── CMS / E-commerce ───────────────────────────────────────────────
  wordpress: { junior: { min: 220, max: 320 }, mid: { min: 350, max: 480 }, senior: { min: 480, max: 650 }, expert: { min: 650, max: 950 } },
  shopify: { junior: { min: 280, max: 380 }, mid: { min: 400, max: 550 }, senior: { min: 550, max: 750 }, expert: { min: 750, max: 1100 } },

  // ─── Mobile ─────────────────────────────────────────────────────────
  "react-native": { junior: { min: 320, max: 420 }, mid: { min: 470, max: 620 }, senior: { min: 620, max: 800 }, expert: { min: 800, max: 1150 } },
  flutter: { junior: { min: 300, max: 400 }, mid: { min: 450, max: 600 }, senior: { min: 600, max: 800 }, expert: { min: 800, max: 1150 } },

  // ─── No-Code ─────────────────────────────────────────────────────────
  webflow: { junior: { min: 250, max: 350 }, mid: { min: 380, max: 520 }, senior: { min: 520, max: 700 }, expert: { min: 700, max: 950 } },
  bubble: { junior: { min: 280, max: 380 }, mid: { min: 420, max: 580 }, senior: { min: 580, max: 750 }, expert: { min: 750, max: 1000 } },

  // ─── IA / ML ─────────────────────────────────────────────────────────
  chatgpt: { junior: { min: 400, max: 500 }, mid: { min: 550, max: 700 }, senior: { min: 700, max: 950 }, expert: { min: 950, max: 1500 } },
  llm: { junior: { min: 450, max: 550 }, mid: { min: 600, max: 800 }, senior: { min: 800, max: 1100 }, expert: { min: 1100, max: 1800 } },
  rag: { junior: { min: 450, max: 550 }, mid: { min: 600, max: 800 }, senior: { min: 800, max: 1100 }, expert: { min: 1100, max: 1700 } },
  "prompt-engineering": { junior: { min: 350, max: 450 }, mid: { min: 500, max: 650 }, senior: { min: 650, max: 850 }, expert: { min: 850, max: 1300 } },
  "machine-learning": { junior: { min: 400, max: 500 }, mid: { min: 550, max: 750 }, senior: { min: 750, max: 1000 }, expert: { min: 1000, max: 1500 } },

  // ─── Cloud / DevOps ──────────────────────────────────────────────────
  aws: { junior: { min: 400, max: 500 }, mid: { min: 550, max: 750 }, senior: { min: 750, max: 1000 }, expert: { min: 1000, max: 1500 } },
  azure: { junior: { min: 380, max: 480 }, mid: { min: 530, max: 720 }, senior: { min: 720, max: 950 }, expert: { min: 950, max: 1400 } },
  gcp: { junior: { min: 400, max: 500 }, mid: { min: 550, max: 750 }, senior: { min: 750, max: 1000 }, expert: { min: 1000, max: 1500 } },
  kubernetes: { junior: { min: 400, max: 500 }, mid: { min: 580, max: 780 }, senior: { min: 780, max: 1050 }, expert: { min: 1050, max: 1550 } },
  terraform: { junior: { min: 400, max: 500 }, mid: { min: 550, max: 750 }, senior: { min: 750, max: 1000 }, expert: { min: 1000, max: 1450 } },
  docker: { junior: { min: 350, max: 450 }, mid: { min: 500, max: 700 }, senior: { min: 700, max: 950 }, expert: { min: 950, max: 1400 } },
  devops: { junior: { min: 400, max: 500 }, mid: { min: 550, max: 750 }, senior: { min: 750, max: 1000 }, expert: { min: 1000, max: 1500 } },
  cybersecurite: { junior: { min: 400, max: 500 }, mid: { min: 600, max: 800 }, senior: { min: 800, max: 1100 }, expert: { min: 1100, max: 1700 } },

  // ─── Macro categories (utilise quand pas de skill specifique) ────────
  "developpement-web": { junior: { min: 280, max: 380 }, mid: { min: 420, max: 580 }, senior: { min: 580, max: 800 }, expert: { min: 800, max: 1200 } },
  "intelligence-artificielle": { junior: { min: 400, max: 500 }, mid: { min: 550, max: 750 }, senior: { min: 750, max: 1050 }, expert: { min: 1050, max: 1600 } },
  "cloud-devops": { junior: { min: 400, max: 500 }, mid: { min: 550, max: 750 }, senior: { min: 750, max: 1000 }, expert: { min: 1000, max: 1500 } },
  "no-code-automation": { junior: { min: 250, max: 350 }, mid: { min: 380, max: 520 }, senior: { min: 520, max: 700 }, expert: { min: 700, max: 950 } },
  "data-analytics": { junior: { min: 350, max: 450 }, mid: { min: 500, max: 700 }, senior: { min: 700, max: 950 }, expert: { min: 950, max: 1400 } },
  "design-produit": { junior: { min: 300, max: 400 }, mid: { min: 450, max: 600 }, senior: { min: 600, max: 800 }, expert: { min: 800, max: 1200 } },
};

export const TJM_SOURCES = [
  {
    name: "Blog du Moderateur",
    title: "Freelance tech : taux journaliers moyens par metier 2026",
    url: "https://www.blogdumoderateur.com/freelance-tech-taux-journaliers-moyens-metier-2026/",
  },
  {
    name: "Free-Work",
    title: "TJM tracker freelance tech (mise a jour mensuelle)",
    url: "https://www.free-work.com/fr/tech-it/jobs/",
  },
  {
    name: "Comet",
    title: "Observatoire du freelancing 2026",
    url: "https://www.comet.co/en/blog/observatoire-freelancing-2026",
  },
];

export function getTjmReference(slug: string): TjmReference | null {
  return TJM_REFERENCE[slug] || null;
}
