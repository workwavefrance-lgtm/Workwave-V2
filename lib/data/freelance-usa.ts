/**
 * Données factuelles des guides "freelance aux USA" (anglais).
 *
 * ⚠️ GARDE-FOU (identique à freelance-visa.ts) : chaque fait (seuil fiscal,
 * règle, formulaire) DOIT être SOURCÉ via le champ `sources` (label + url
 * officiel : IRS.gov, SBA.gov, USCIS.gov, travel.state.gov). AUCUN chiffre
 * inventé : soit on cite une source officielle exacte, soit on reste qualitatif
 * ("varies by income bracket"). Les seuils en dollars présents ici sont tous
 * tirés des pages IRS citées au moment de la dernière revue (`lastReviewed`).
 *
 * Les pages affichent un disclaimer "General information, not legal/tax advice —
 * rules change, confirm with official sources" + la date de dernière revue.
 *
 * Shape calquée sur VisaGuide (lib/data/freelance-visa.ts) mais adaptée au
 * contexte US : pas de "permit"/"validity", plutôt des "key points" et des
 * "sections" thématiques.
 */

import type { MonumentName } from "@/components/ai/MonumentArt";

export type UsaSource = { label: string; url: string };

export type UsaGuideSection = {
  /** Titre de la section (h2). */
  title: string;
  /** Paragraphes de la section (texte neutre, sourcé). */
  paragraphs: string[];
  /** Liste à puces optionnelle pour cette section. */
  bullets?: string[];
};

export type UsaGuide = {
  topicSlug: string;
  /** Titre court affiché dans les cards du hub. */
  cardTitle: string;
  /** H1 complet de la page guide. */
  title: string;
  /** Meta description (≈ 150-160 car.). */
  metaDescription: string;
  /** Monument line-art utilisé dans le hero. */
  monument: MonumentName;
  /** Phrase d'intro (neutre / sourcée). */
  intro: string;
  /** Points clés à retenir (équivalent permitNames). */
  keyPoints: string[];
  /** Corps du guide en sections thématiques. */
  sections: UsaGuideSection[];
  /** Étapes pratiques de haut niveau (équivalent steps). */
  steps: string[];
  /** Points d'attention / nuances importantes. */
  caveats: string[];
  /** Q/R spécifiques au guide (alimente le schema FAQPage). */
  faq: { q: string; a: string }[];
  sources: UsaSource[];
  confidence: "high" | "medium" | "low";
  /** Mois de dernière revue, ex. "2026-05". */
  lastReviewed: string;
};

export const USA_GUIDES: Record<string, UsaGuide> = {
  // ────────────────────────────────────────────────────────────────────────
  // 1. LLC vs sole proprietorship
  // ────────────────────────────────────────────────────────────────────────
  "llc-vs-sole-proprietorship": {
    topicSlug: "llc-vs-sole-proprietorship",
    cardTitle: "LLC vs sole proprietorship",
    title: "LLC vs sole proprietorship for US freelancers",
    metaDescription:
      "LLC or sole proprietorship as a US freelancer? How they differ on personal liability, pass-through taxes and paperwork — plus how to form an LLC and get a free EIN. Sourced from IRS & SBA.",
    monument: "statue-liberty",
    intro:
      "Most US freelancers start as a sole proprietor — it is the default the moment you do paid work for yourself, with no paperwork. A limited liability company (LLC) is a formal business structure you register with a state. The big practical differences are personal liability protection and formality, not the everyday tax bill: a single-member LLC is taxed the same way as a sole proprietorship by default.",
    keyPoints: [
      "A sole proprietorship is the automatic, unregistered default for one-person businesses; an LLC is a legal entity you form by filing with a state.",
      "The SBA notes an LLC protects your personal assets (home, car, savings) from most business debts and lawsuits, while a sole proprietor can be held personally liable for the business's debts.",
      "By default a single-member LLC is a 'disregarded entity' for federal income tax — the IRS treats it the same as a sole proprietorship, with profit reported on Schedule C of your Form 1040.",
      "LLC owners and sole proprietors both pay self-employment tax on their net earnings.",
      "An LLC can elect to be taxed as a corporation (Form 8832), but that is an optional choice, not the default.",
    ],
    sections: [
      {
        title: "The default: sole proprietorship",
        paragraphs: [
          "If you do paid freelance work for yourself and never register an entity, you are a sole proprietor by default. There is no separate legal entity — you and the business are the same for legal and tax purposes.",
          "The trade-off is liability. The SBA states plainly that a sole proprietor \"can be held personally liable for the debts and obligations of the business,\" and describes the structure as best for \"low-risk businesses and owners who want to test their business idea before forming a more formal business.\"",
        ],
      },
      {
        title: "What an LLC changes: liability",
        paragraphs: [
          "An LLC is a business structure created under state law. Its main draw for freelancers is the liability shield. The SBA describes it this way: \"LLCs protect you from personal liability in most instances — your personal assets, like your vehicle, house, and savings accounts, won't be at risk in case your LLC faces bankruptcy or lawsuits.\"",
          "That protection is not absolute (it can be lost if you mix personal and business finances, or in cases of fraud), but for higher-risk or higher-revenue freelancing it is the core reason people form an LLC.",
        ],
      },
      {
        title: "Taxes: usually the same by default",
        paragraphs: [
          "A common myth is that an LLC saves you tax automatically. It generally does not, by default. The IRS treats a single-member LLC as a \"disregarded entity\": \"For income tax purposes, an LLC with only one member is treated as an entity disregarded as separate from its owner, unless it files Form 8832 and affirmatively elects to be treated as a corporation.\"",
          "In practice that means you report business profit on Schedule C of your personal Form 1040 — exactly as a sole proprietor does. The IRS confirms an individual owner of a single-member LLC \"is subject to the tax on net earnings from self employment in the same manner as a sole proprietorship.\"",
          "An LLC can elect a different tax treatment (for example, S-corporation taxation) once it makes sense, but that is an active election, often best discussed with a tax professional — not a reason to form an LLC on day one.",
        ],
      },
      {
        title: "Getting an EIN",
        paragraphs: [
          "An EIN (Employer Identification Number) is a federal tax ID for a business. The IRS issues it directly, in minutes, online — and it is free.",
          "The IRS warns: \"Beware of websites that charge for an EIN. You never have to pay a fee for an EIN.\" A single-member LLC that is a disregarded entity with no employees and no excise-tax liability is not strictly required to have one, but many freelancers get an EIN anyway to avoid giving out their Social Security number on tax forms and to open a business bank account.",
        ],
      },
    ],
    steps: [
      "Decide whether you need the liability shield now (higher-risk work, contracts, real revenue) or whether staying a sole proprietor is fine while you test the business.",
      "If forming an LLC: file Articles of Organization with your state's business filing office and pay the state fee (fees and rules vary by state — check your Secretary of State).",
      "Get a free EIN directly from the IRS online (never pay a third party for one).",
      "Open a dedicated business bank account and keep personal and business money separate (important for keeping the LLC's liability protection intact).",
      "Track income and expenses, and report business profit on Schedule C of your Form 1040 — see our US freelancer tax guide.",
    ],
    caveats: [
      "LLC formation fees, annual fees and rules are set by each state and vary widely — the SBA notes requirements differ by state, so check your own state's Secretary of State office.",
      "The liability shield can be pierced if you commingle personal and business funds or commit fraud — keeping clean, separate finances matters.",
      "An LLC does not automatically lower your taxes. Any tax election (such as being taxed as a corporation via Form 8832, or S-corp status) is a separate decision best reviewed with a licensed tax professional.",
    ],
    faq: [
      {
        q: "Do I need an LLC to freelance in the US?",
        a: "No. By default you are a sole proprietor the moment you do paid work for yourself, with no registration required. An LLC is optional — its main benefit is protecting your personal assets from business debts and lawsuits (per the SBA). Many freelancers stay sole proprietors while testing an idea and form an LLC later.",
      },
      {
        q: "Does an LLC save me money on taxes?",
        a: "Usually not by default. The IRS treats a single-member LLC as a 'disregarded entity', taxed the same as a sole proprietorship — profit goes on Schedule C of your Form 1040 and you pay self-employment tax. An LLC can elect a different tax treatment (e.g. S-corp) once it makes sense, but that is a separate choice best discussed with a tax professional.",
      },
      {
        q: "How do I get an EIN, and does it cost money?",
        a: "You get an EIN directly from the IRS online, for free, in minutes. The IRS explicitly warns you never have to pay for an EIN and to beware of sites that charge for one.",
      },
    ],
    sources: [
      { label: "SBA — Choose a business structure (sole proprietorship & LLC)", url: "https://www.sba.gov/business-guide/launch-your-business/choose-business-structure" },
      { label: "IRS — Single member limited liability companies", url: "https://www.irs.gov/businesses/small-businesses-self-employed/single-member-limited-liability-companies" },
      { label: "IRS — Limited liability company (LLC)", url: "https://www.irs.gov/businesses/small-businesses-self-employed/limited-liability-company-llc" },
      { label: "IRS — Get an employer identification number (EIN)", url: "https://www.irs.gov/businesses/small-businesses-self-employed/get-an-employer-identification-number" },
    ],
    confidence: "high",
    lastReviewed: "2026-05",
  },

  // ────────────────────────────────────────────────────────────────────────
  // 2. Freelancer taxes: 1099 vs W-2, SE tax, quarterly estimates, Schedule C
  // ────────────────────────────────────────────────────────────────────────
  "freelancer-taxes-1099": {
    topicSlug: "freelancer-taxes-1099",
    cardTitle: "Freelancer taxes & 1099s",
    title: "Freelancer taxes in the US: 1099 vs W-2, self-employment tax & quarterly estimates",
    metaDescription:
      "How US freelancer taxes work: 1099 vs W-2, the 15.3% self-employment tax, quarterly estimated taxes and Schedule C. Plain-English overview sourced from the IRS.",
    monument: "us-capitol",
    intro:
      "As a US freelancer you are 'self-employed' in the eyes of the IRS — which means no employer withholds taxes for you. You generally report your business profit on Schedule C, pay self-employment tax for Social Security and Medicare, and pay your income tax in four estimated instalments through the year instead of one bill in April.",
    keyPoints: [
      "The IRS considers you self-employed if you carry on a trade or business as a sole proprietor or independent contractor, or are otherwise in business for yourself (including gig work).",
      "Independent-contractor income is typically reported to you on Form 1099-NEC; employees instead get a Form W-2 with taxes already withheld.",
      "Self-employment (SE) tax is 15.3% — 12.4% for Social Security plus 2.9% for Medicare — on your net self-employment earnings (subject to limits below).",
      "You must file an income tax return if your net earnings from self-employment were $400 or more.",
      "You generally must pay quarterly estimated taxes if you expect to owe $1,000 or more for the year, using Form 1040-ES.",
      "Key forms: Schedule C (business profit/loss), Schedule SE (self-employment tax), and Form 1040-ES (estimated payments).",
    ],
    sections: [
      {
        title: "1099 vs W-2: which one are you?",
        paragraphs: [
          "An employee receives a Form W-2 and has income tax, Social Security and Medicare withheld from each paycheck by their employer. A freelancer or independent contractor is paid without withholding, and a business that pays an independent contractor reports it on Form 1099-NEC (Nonemployee Compensation).",
          "Whether you are truly an independent contractor versus an employee is decided by the actual working relationship, not just a label. The IRS looks at common-law factors grouped as behavioral control, financial control and the type of relationship, and stresses there is \"no 'magic' or set number of factors\" — you weigh the whole relationship.",
          "Practically: as an independent contractor you are self-employed, so the tax responsibilities below fall on you rather than an employer.",
        ],
        bullets: [
          "W-2 = employee, taxes withheld by employer.",
          "1099-NEC = independent contractor / freelancer, no withholding — you handle the tax yourself.",
          "A client must generally issue a 1099-NEC when they pay you $600 or more in a year for your services (note: the IRS has stated this reporting threshold rises to $2,000 for payments made after December 31, 2025).",
          "You owe tax on your freelance income even if no 1099 is issued.",
        ],
      },
      {
        title: "Self-employment tax (Social Security + Medicare)",
        paragraphs: [
          "Because no employer pays the employer share of Social Security and Medicare for you, you cover both halves yourself through self-employment tax. The IRS states: \"The self-employment tax rate is 15.3%. The rate consists of two parts: 12.4% for social security (old-age, survivors, and disability insurance) and 2.9% for Medicare (hospital insurance).\"",
          "Only a limited amount of earnings is subject to the Social Security portion each year. The IRS gives this as the annual Social Security wage base — for 2024, the first $168,600 of combined wages and net earnings was subject to the Social Security part (this figure is set annually and changes each year, so check the current one). The 2.9% Medicare portion has no such cap.",
          "Two things soften the blow: you can deduct the employer-equivalent portion of your SE tax when figuring your adjusted gross income, and SE tax is calculated on net earnings (after business expenses), not gross revenue. A higher-earning freelancer may also owe an Additional Medicare Tax of 0.9% on income above a threshold ($200,000 for single filers, $250,000 for married filing jointly).",
        ],
      },
      {
        title: "Quarterly estimated taxes",
        paragraphs: [
          "The US tax system is pay-as-you-go. Employees meet this through paycheck withholding; freelancers meet it by paying estimated taxes during the year. The IRS states that individuals \"generally have to make estimated tax payments if they expect to owe tax of $1,000 or more when their return is filed.\"",
          "The year is divided into four payment periods, and you use Form 1040-ES to figure and pay each instalment. Missing or underpaying estimates can trigger an underpayment penalty, so many freelancers set aside a percentage of every payment they receive.",
        ],
      },
      {
        title: "Schedule C: reporting your profit",
        paragraphs: [
          "You report freelance income and expenses on Schedule C (Profit or Loss from Business), which attaches to your Form 1040. Your net profit from Schedule C flows into Schedule SE to compute self-employment tax, and into your 1040 for income tax.",
          "Keeping good records of business expenses matters: legitimate expenses reduce your net profit, which reduces both your income tax and your self-employment tax.",
        ],
      },
    ],
    steps: [
      "Confirm you are self-employed (independent contractor / sole proprietor) rather than an employee — the working relationship decides it, per IRS common-law factors.",
      "Set aside a portion of every client payment for taxes, since nothing is withheld for you.",
      "Track all business income and expenses throughout the year.",
      "Pay quarterly estimated taxes with Form 1040-ES if you expect to owe $1,000 or more.",
      "At year end, file Schedule C (profit/loss) and Schedule SE (self-employment tax) with your Form 1040.",
      "If your tax situation is at all complex, work with a licensed CPA or tax professional.",
    ],
    caveats: [
      "Dollar thresholds and the Social Security wage base change over time — always confirm the current year's figures on IRS.gov before relying on them.",
      "Tax rules vary at the state and local level too (state income tax, local business taxes); this guide covers federal basics only.",
      "This is general information, not tax advice. For your specific situation — deductions, an S-corp election, multi-state work — consult a licensed tax professional.",
    ],
    faq: [
      {
        q: "How much is self-employment tax for US freelancers?",
        a: "The IRS sets the self-employment tax rate at 15.3% — 12.4% for Social Security plus 2.9% for Medicare — on your net self-employment earnings. Only earnings up to the annual Social Security wage base are subject to the 12.4% portion (this base is set each year), and the Medicare portion has no cap. You can deduct the employer-equivalent portion of SE tax when figuring adjusted gross income.",
      },
      {
        q: "Do freelancers pay taxes quarterly in the US?",
        a: "Generally yes. The IRS says you usually must make quarterly estimated tax payments if you expect to owe $1,000 or more for the year, using Form 1040-ES, because no employer withholds tax from your freelance income. The year has four payment periods.",
      },
      {
        q: "What's the difference between a 1099 and a W-2?",
        a: "A W-2 is for employees and shows wages with income, Social Security and Medicare taxes already withheld by the employer. A 1099-NEC reports payments to an independent contractor, with no withholding — so as a freelancer you handle the tax yourself. A client generally issues a 1099-NEC when they pay you $600 or more in a year (the IRS has stated this threshold rises to $2,000 for payments after December 31, 2025), but you owe tax on freelance income even if no 1099 is issued.",
      },
      {
        q: "Do I have to file taxes on a small amount of freelance income?",
        a: "The IRS says you have to file an income tax return if your net earnings from self-employment were $400 or more. Even below that, other rules may require a return — and you still owe income tax on the income.",
      },
    ],
    sources: [
      { label: "IRS — Self-employed individuals tax center", url: "https://www.irs.gov/businesses/small-businesses-self-employed/self-employed-individuals-tax-center" },
      { label: "IRS — Self-employment tax (Social Security and Medicare taxes)", url: "https://www.irs.gov/businesses/small-businesses-self-employed/self-employment-tax-social-security-and-medicare-taxes" },
      { label: "IRS — Estimated taxes", url: "https://www.irs.gov/businesses/small-businesses-self-employed/estimated-taxes" },
      { label: "IRS — Independent contractor (self-employed) or employee?", url: "https://www.irs.gov/businesses/small-businesses-self-employed/independent-contractor-self-employed-or-employee" },
      { label: "IRS — About Form 1099-NEC, Nonemployee Compensation", url: "https://www.irs.gov/forms-pubs/about-form-1099-nec" },
    ],
    confidence: "high",
    lastReviewed: "2026-05",
  },

  // ────────────────────────────────────────────────────────────────────────
  // 3. Work authorization for foreign freelancers
  // ────────────────────────────────────────────────────────────────────────
  "work-authorization-foreign-freelancers": {
    topicSlug: "work-authorization-foreign-freelancers",
    cardTitle: "Work authorization for foreigners",
    title: "Can foreigners freelance in the US? Work authorization basics",
    metaDescription:
      "There is no US 'freelance visa'. What foreign nationals actually need to work in the US — citizens, green-card holders, EAD or status-based authorization — sourced from USCIS. Not legal advice.",
    monument: "skyline-global",
    intro:
      "There is no dedicated 'freelance visa' in the United States. US immigration law is built around being authorized to work — generally as a citizen, a lawful permanent resident (green-card holder), or a noncitizen whose immigration status or work permit allows it. This guide explains the basic framework from USCIS so you can ask the right questions. It is general information, not immigration or legal advice.",
    keyPoints: [
      "The US has no 'freelance visa' as such — work authorization is the concept that matters, not a freelance-specific permit.",
      "US citizens and lawful permanent residents (green-card holders) are authorized to work; a green card itself is evidence of that authorization, per USCIS.",
      "A noncitizen who is not a permanent resident generally needs to prove they may work — often with an Employment Authorization Document (EAD, Form I-766), requested via Form I-765.",
      "Some nonimmigrant statuses authorize work for a specific employer 'incident to status' (USCIS lists H-1B, L-1B, O and P) — these are employer-sponsored, not open-ended freelancing.",
      "A visitor (B-1/B-2) generally cannot perform work for hire in the US; the eligibility categories for work authorization are set in federal regulation (8 CFR 274a.12).",
      "Working remotely from your own country for US clients is a different situation from working inside the US — and brings its own local tax and legal rules to check at home.",
    ],
    sections: [
      {
        title: "There is no 'freelance visa'",
        paragraphs: [
          "Unlike some countries that issue a specific freelance permit, the US framework is about whether you are authorized to work, period. USCIS frames it around categories of people rather than a freelance document: citizens, lawful permanent residents, and other noncitizens who have permission to work.",
          "So the honest answer to 'how do I get a US freelance visa?' is that one does not exist. The real questions are: are you already authorized to work in the US, and if not, does any immigration pathway fit your situation?",
        ],
      },
      {
        title: "Who is already authorized to work",
        paragraphs: [
          "Two groups are authorized without applying for a separate work permit. US citizens are automatically authorized. Lawful permanent residents are too — USCIS states you do not need to apply for an EAD if you are a lawful permanent resident, because \"your Green Card (Form I-551, Permanent Resident Card) is evidence of your employment authorization.\"",
          "If you fall into either group, you can freelance like any other US-based self-employed person (see our guides on business structure and freelancer taxes).",
        ],
      },
      {
        title: "Noncitizens: EAD or status-based authorization",
        paragraphs: [
          "If you are neither a citizen nor a permanent resident, USCIS says you \"may need to prove that you can work in the United States by presenting an Employment Authorization Document (Form I-766/EAD).\" An EAD is typically requested by filing Form I-765, and it is open-ended in the sense that it lets you work for any employer (or for yourself) for its validity period.",
          "Separately, some nonimmigrant statuses authorize work for a specific employer 'incident to status' — USCIS gives H-1B, L-1B, O and P nonimmigrants as examples, who do not need a separate EAD. Crucially, those routes are tied to an employer/petitioner, which is a different model from independent freelancing.",
          "The list of who qualifies for employment authorization, and under which category, is set out in federal regulation at 8 CFR 274a.12. Form I-765 asks you to state the correct eligibility category, which is why getting advice on your specific situation matters.",
        ],
        bullets: [
          "EAD (Form I-766), requested via Form I-765 — lets the holder work, including for themselves, for the EAD's validity.",
          "Status that authorizes work for a specific employer incident to status (e.g. H-1B, L-1B, O, P) — employer-tied, not open freelancing.",
          "Eligibility categories are defined in 8 CFR 274a.12.",
        ],
      },
      {
        title: "Visitors can't work — and remote work from abroad is different",
        paragraphs: [
          "Being physically in the US on a visitor status does not allow you to take on work for hire. The US Department of State notes a B-1 business visa \"is not appropriate\" for someone who intends to obtain and engage in employment in the US, and that B-1/B-2 visitors are not permitted to accept employment or work in the US (B-1 visitors may do things like negotiate contracts or attend conferences, but not perform local work for hire).",
          "A genuinely different scenario is a foreign national living in their own country and doing remote work for US clients. That person is generally not 'working in the United States' for US immigration purposes — but it raises tax and business-registration questions in their home country (and possibly US tax-withholding rules for the client). Those are local-law questions to confirm where you live; this guide does not cover them.",
        ],
      },
    ],
    steps: [
      "Work out which group you are in: US citizen, lawful permanent resident, another noncitizen, or someone working remotely from abroad.",
      "If you are a citizen or green-card holder, you are authorized to work — proceed like any US-based freelancer.",
      "If you are a noncitizen in the US, check whether you have (or can obtain) an EAD or a status that authorizes work, and confirm the correct eligibility category on USCIS.gov.",
      "If you are abroad working for US clients, confirm the registration, tax and invoicing rules in your own country (and whether any US tax-withholding applies to the client).",
      "For anything specific to your case, consult a licensed US immigration attorney — immigration consequences are serious and fact-specific.",
    ],
    caveats: [
      "Immigration rules are complex, change over time and depend heavily on your individual facts — this guide is a high-level orientation only, not immigration advice.",
      "Working without authorization, or doing work for hire on a visitor status, can carry serious immigration consequences. When in doubt, do not work until you have confirmed your status.",
      "Eligibility categories and the right form/category for your situation are defined in federal regulation (8 CFR 274a.12); a licensed US immigration attorney is the right person to confirm your specific path.",
    ],
    faq: [
      {
        q: "Is there a freelance visa for the United States?",
        a: "No. The US has no dedicated 'freelance visa'. Immigration law is built around work authorization — generally you must be a US citizen, a lawful permanent resident (green-card holder), or a noncitizen whose immigration status or Employment Authorization Document allows you to work. The right pathway depends entirely on your individual situation.",
      },
      {
        q: "Can a foreigner legally freelance in the US?",
        a: "Only if they are authorized to work in the US. US citizens and green-card holders are authorized automatically (the green card itself is evidence, per USCIS). Other noncitizens generally need an Employment Authorization Document (EAD, Form I-766) or a status that authorizes work — though some of those, like H-1B or L-1B, are tied to a specific employer rather than open freelancing. This is general information, not immigration advice.",
      },
      {
        q: "Can I freelance for US clients from my own country?",
        a: "Working remotely from your own country for US clients is a different situation from working inside the US, and is generally not 'working in the United States' for US immigration purposes. But it raises tax and business-registration rules in your home country (and possibly US tax-withholding rules for the client). Confirm those local rules where you live.",
      },
    ],
    sources: [
      { label: "USCIS — Working in the United States", url: "https://www.uscis.gov/working-in-the-united-states" },
      { label: "USCIS — Employment Authorization Document (EAD)", url: "https://www.uscis.gov/green-card/green-card-processes-and-procedures/employment-authorization-document" },
      { label: "USCIS — I-765, Application for Employment Authorization", url: "https://www.uscis.gov/i-765" },
      { label: "USCIS — B-1 Temporary Business Visitor", url: "https://www.uscis.gov/working-in-the-united-states/temporary-visitors-for-business/b-1-temporary-business-visitor" },
      { label: "U.S. Department of State — Visitor Visa (B-1/B-2)", url: "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html" },
    ],
    confidence: "high",
    lastReviewed: "2026-05",
  },
};

export function getUsaGuide(slug: string): UsaGuide | null {
  return USA_GUIDES[slug] ?? null;
}

export function usaGuideSlugs(): string[] {
  return Object.keys(USA_GUIDES);
}
