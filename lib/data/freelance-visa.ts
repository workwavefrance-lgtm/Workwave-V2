/**
 * Données factuelles des guides visa/permis freelance par pays.
 *
 * ⚠️ GARDE-FOU : chaque fait (nom de permis, coût, règle) DOIT être SOURCÉ
 * (champ `sources`). Aucune valeur inventée. Si un point est incertain, le dire
 * dans `caveats` et baisser `confidence`. Les pages affichent un disclaimer
 * "information générale, pas un conseil juridique — vérifiez les sources".
 *
 * Rempli à partir d'une recherche web sourcée (sous-agent). Pays sans guide
 * fiable = pas d'entrée ici (la page tombe en 404 proprement).
 */

export type VisaSource = { label: string; url: string };

export type VisaGuide = {
  countrySlug: string; // doit matcher GULF_COUNTRIES[].slug
  /** Phrase d'intro spécifique au pays (sourcée / neutre). */
  intro: string;
  /** Noms des permis/visas freelance pertinents. */
  permitNames: string[];
  /** Résumé coût (sourcé), ex. "From ~AED 7,500/year (≈ $2,040), varies by free zone". */
  costSummary: string;
  /** Éligibilité : expatriés vs nationaux, restrictions. */
  eligibility: string;
  /** Organismes émetteurs / free zones. */
  issuers: string;
  /** Étapes de candidature (haut niveau). */
  steps: string[];
  /** Validité / renouvellement. */
  validity: string;
  /** Points clés à connaître. */
  caveats: string[];
  sources: VisaSource[];
  confidence: "high" | "medium" | "low";
  /** Mois de dernière revue, ex. "2026-05". */
  lastReviewed: string;
};

// Wave 1 : 3 pays à HAUTE confiance (UAE, Saudi, Qatar). Bahrein/Koweit/Oman
// volontairement omis (statuts en flux / non-live / sources contradictoires —
// garde-fou : on ne publie pas de droit incertain). Sources officielles citées.
export const VISA_GUIDES: Record<string, VisaGuide> = {
  uae: {
    countrySlug: "uae",
    intro:
      "The UAE has the Gulf's clearest framework for freelancers: a freelance permit (a professional licence to legally do the work, issued by a free zone or MOHRE) plus a residence visa. The two are separate — you typically need both.",
    permitNames: [
      "GoFreelance permit (Dubai, TECOM / Dubai Development Authority) — media, tech, education, marketing, design, consulting",
      "Free-zone freelance packages: RAKEZ, Ajman Free Zone, UAQ FTZ, twofour54 (Abu Dhabi media zone)",
      "MOHRE federal freelance / self-employment permit",
      "Abu Dhabi Green Visa — a 5-year self-sponsored residence visa (separate from the work permit)",
    ],
    costSummary:
      "Indicative figures: the GoFreelance/TECOM permit is around AED 7,500/year (~$2,050); RAKEZ ~AED 12,000; UAQ FTZ ~AED 10,000. Once you add the residence visa, medical test, Emirates ID and insurance, the first-year total is typically AED 12,000–16,000 (~$3,300–4,400). twofour54 waives licence fees for the first two years. These figures bundle service fees and change often — confirm the current fee with the issuer.",
    eligibility:
      "Yes — freelance permits and the Green Visa are open to expatriates, with no nationality restriction. You must be 18+. Some activities (IT, consulting, education) may require an attested bachelor's degree, while many creative roles do not.",
    issuers:
      "Dubai DDA / TECOM (GoFreelance), RAKEZ, Ajman Free Zone, UAQ FTZ and twofour54 for the permit; MOHRE for the federal permit; and ICP for the Green Visa residency.",
    steps: [
      "Choose a free zone or authority that matches your activity (e.g. GoFreelance for media/tech).",
      "Submit your passport, photo, CV/portfolio and proof of qualifications, and pass a background check.",
      "Pay the permit fee and receive your freelance permit plus establishment card.",
      "Apply for the entry permit, take the medical fitness test, get your Emirates ID and stamp your residence visa.",
      "Optionally apply for the 5-year Green Visa via ICP if you meet the income and qualification thresholds.",
    ],
    validity:
      "Freelance permit: 1 year, renewable annually. Free-zone residence visa: 2 years. Green Visa: 5 years, renewable (self-sponsored).",
    caveats: [
      "The permit (right to work) and the residence visa (right to live in the UAE) are separate — you usually need both. Some sources note TECOM may currently issue the permit only, not the visa, so verify before relying on it for residency.",
      "The Green Visa requires a MOHRE freelance permit, a bachelor's degree, and annual self-employment income of at least AED 360,000 (~$98,000) for each of the previous two years, or proof of financial solvency.",
      "The UAE has 0% personal income tax, but a 9% corporate tax applies on profits above AED 375,000, plus 5% VAT — check whether your structure is affected.",
    ],
    sources: [
      { label: "Abu Dhabi Government — Green Visa for freelancers (official)", url: "https://www.added.gov.ae/en/live/long-term-residency/abu-dhabi-green-visa/for-freelancers" },
      { label: "ICP — Green residency (official)", url: "https://icp.gov.ae/en/green-residency/" },
      { label: "Emirabiz — UAE freelance permit overview", url: "https://emirabiz.com/uae-freelance-permit/" },
    ],
    confidence: "high",
    lastReviewed: "2026-05",
  },
  "saudi-arabia": {
    countrySlug: "saudi-arabia",
    intro:
      "Saudi Arabia's official freelance document (Wathiqat Al-Amal Al-Hur) is for Saudi nationals only. Expatriates who want to work independently generally need an investment licence (MISA) or Premium Residency instead — and freelancing on the wrong status carries serious penalties.",
    permitNames: [
      "Freelance Work Document / 'Wathiqat Al-Amal Al-Hur' (MHRSD) — Saudi nationals only, covering 120+ professions",
      "For expats: MISA Entrepreneur Licence (Ministry of Investment)",
      "For expats: Premium Residency (Entrepreneur / Special Talent track)",
    ],
    costSummary:
      "The Freelance Work Document is free and valid for one year (renewable) — but for Saudi nationals only. The expat routes (MISA licence, Premium Residency) carry significant fees and capital requirements that vary by track. We don't quote a fixed expat figure here because reliable 2026 numbers weren't available — confirm on the official MISA / Premium Residency portals.",
    eligibility:
      "The Freelance Work Document is reserved for Saudi nationals (typically aged 18–60). Expatriates generally cannot obtain it and must instead use a MISA investment licence or Premium Residency. Working as an undocumented 'freelancer' as a foreigner is treated as a serious commercial-concealment ('Tasattur') violation.",
    issuers:
      "MHRSD (Ministry of Human Resources & Social Development) for the freelance document; MISA (Ministry of Investment) for entrepreneur licences; the Premium Residency Center for premium residency.",
    steps: [
      "(Saudi nationals) Register on the MHRSD freelance portal and verify your identity via Absher/Nafath.",
      "Select your profession(s) from the approved list and submit.",
      "Receive the free freelance document, then use it to invoice, open a commercial bank account and register voluntarily with GOSI.",
      "(Expats) Instead apply for a MISA entrepreneur licence or Premium Residency via their official portals.",
    ],
    validity: "Freelance Work Document: 1 year, renewable for similar periods.",
    caveats: [
      "For foreigners, working as a 'freelancer' without a formal investment or commercial licence is a 'Tasattur' (anti-concealment) violation, with reported penalties up to SAR 50,000 and possible jail or deportation.",
      "Since mid-2025 MHRSD has added flexible work permits (1/3/6-month) for expats, but these are employer-issued — not true independent freelancing.",
      "Saudi Arabia has no personal income tax on individuals, but 15% VAT applies.",
    ],
    sources: [
      { label: "MHRSD — Freelance work document service (official)", url: "https://www.hrsd.gov.sa/en/ministry-services/services/1065686" },
      { label: "Motaded — Saudi freelance regulations guide (2026)", url: "https://motaded.com.sa/blog/saudi-freelance-regulations-guide" },
      { label: "Jobbers — freelancing in Saudi Arabia for expats", url: "https://www.jobbers.io/freelancing-in-saudi-arabia-opportunities-legal-considerations-for-expats/" },
    ],
    confidence: "high",
    lastReviewed: "2026-05",
  },
  qatar: {
    countrySlug: "qatar",
    intro:
      "Qatar has no dedicated 'freelance visa' for expatriates. To work independently and legally you either set up a company (via the Qatar Financial Centre or a Free Zone) that sponsors your residence, or qualify for the 5-year Mustaqel ('Independent') visa for talent and entrepreneurs.",
    permitNames: [
      "No standalone freelance visa exists in Qatar",
      "Mustaqel ('Independent') visa — a 5-year renewable residency for talented professionals and entrepreneurs (administered by Jusour)",
      "Company-based routes: Qatar Financial Centre (QFC) or Qatar Free Zones Authority (QFZA) sole-proprietor / company setup",
    ],
    costSummary:
      "There is no freelance-visa fee because no such visa exists. The Mustaqel entrepreneur track reportedly requires a minimum investment of around QAR 250,000 plus an endorsed business plan — verify on the official channel. 'Freelance visa' offers from sponsors are not an official route and are legally risky (see below).",
    eligibility:
      "No freelance visa for expats. Mustaqel is open to expatriates but gated to high-skill talent or funded entrepreneurs with an entity or incubator endorsement — not ordinary digital freelancers. The company routes (QFC / Free Zone) are open to anyone who sets up the entity.",
    issuers:
      "Ministry of Interior (residency); Jusour (Qatar Manpower Solutions) administers Mustaqel; QFC and QFZA for company-based setups.",
    steps: [
      "Decide on a legal route: a company via QFC or a Free Zone, or the Mustaqel visa.",
      "For a company: register the entity (QFC or Free Zone), which then sponsors your residence permit.",
      "For Mustaqel: secure a talent endorsement or a funded business plan via a recognised Qatari incubator, then apply through Jusour.",
      "Complete residency formalities (medical, ID) once you are sponsored.",
    ],
    validity: "Mustaqel: 5 years, renewable. Standard work/residence permits: 1–2 years.",
    caveats: [
      "Paying a sponsor to 'freelance' while not genuinely employed by them is illegal under Qatari labour law — penalties include fines, deportation and blacklisting. Avoid 'freelance visa' offers from sponsors.",
      "Qatar has no personal income tax for individuals.",
    ],
    sources: [
      { label: "EY — Qatar's new 5-year Mustaqel residence visa (tax alert)", url: "https://www.ey.com/en_gl/technical/tax-alerts/qatar-announces-new-five-year-mustaqel-residence-visa-for-foreig" },
      { label: "Commitbiz — freelance visa in Qatar (overview)", url: "https://www.commitbiz.com/blog/freelance-visa-in-qatar" },
    ],
    confidence: "high",
    lastReviewed: "2026-05",
  },
};

export function getVisaGuide(slug: string): VisaGuide | null {
  return VISA_GUIDES[slug] ?? null;
}

export function visaGuideSlugs(): string[] {
  return Object.keys(VISA_GUIDES);
}
