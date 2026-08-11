"use client";

import { useActionState, useEffect, useState } from "react";
import { submitProject, type FormState } from "@/app/(public)/deposer-projet/actions";
import CityAutocomplete from "@/components/project/CityAutocomplete";
import { trackClient } from "@/lib/analytics/client-track";
import { EVENTS } from "@/lib/analytics/events";

type Category = {
  id: number;
  name: string;
  vertical: string;
};

type Props = {
  categories: Category[];
  /** Pré-remplissage depuis query params (ex: depuis page listing / fiche pro) */
  defaultCategoryId?: number;
  defaultCity?: { id: number; name: string } | null;
  /** Texte deja saisi par l'utilisateur dans la barre de recherche de l'accueil
   *  quand aucun metier ne correspondait ("fuite d'eau", "refaire ma salle de
   *  bain"...). On le reporte ici pour qu'il n'ait pas a le retaper. */
  defaultDescription?: string;
};

const VERTICAL_LABELS: Record<string, string> = {
  btp: "BTP et artisanat",
  domicile: "Services à domicile",
  personne: "Aide à la personne",
};

const URGENCY_OPTIONS = [
  { value: "today", label: "Aujourd'hui" },
  { value: "this_week", label: "Cette semaine" },
  { value: "this_month", label: "Ce mois-ci" },
  { value: "not_urgent", label: "Pas pressé" },
];

const BUDGET_OPTIONS = [
  { value: "lt500", label: "Moins de 500 €" },
  { value: "500_2000", label: "500 € – 2 000 €" },
  { value: "2000_5000", label: "2 000 € – 5 000 €" },
  { value: "5000_15000", label: "5 000 € – 15 000 €" },
  { value: "gt15000", label: "Plus de 15 000 €" },
  { value: "unknown", label: "Je ne sais pas" },
];

const STEPS = ["Métier", "Ville", "Projet", "Contact"];
const initialState: FormState = { success: false };

// Validation client des coordonnées (étape 4), alignée sur le schéma Zod serveur
// (cf. deposer-projet/actions.ts). Sert UNIQUEMENT à activer/griser le bouton
// "Envoyer ma demande" — pas à afficher des erreurs. Évite le "mur rouge" quand
// l'utilisateur clique Envoyer sur des champs vides : le bouton reste simplement
// grisé tant que ce n'est pas valide, comme le bouton "Continuer" des étapes 1-3.
const PHONE_RE = /^(?:(?:\+33|0)\s?[1-9])(?:[\s.-]?\d{2}){4}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Formulaire multi-step "Déposer un projet".
 *
 * Pourquoi multi-step plutôt qu'un long formulaire d'un coup :
 * - Diagnostic mai 2026 : drop-off 90 % entre form_started (21) et
 *   form_submitted (2) sur 28 jours. Cause : 9 champs visibles d'un
 *   coup = effet "wall of forms" qui décourage.
 * - Découper en 4 étapes (Métier → Ville → Projet → Contact) :
 *   l'utilisateur s'engage en 1 clic à l'étape 1, finit plus
 *   souvent. Drop-off attendu : 90 % → 50-60 %.
 *
 * Implementation : tous les champs sont rendus en permanence dans
 * le DOM (juste cachés visuellement via `hidden` sur la div
 * parente) pour que toutes les valeurs partent dans le FormData au
 * submit final. Les champs qui pilotent canProceed (categoryId,
 * cityId, urgency, budget) passent en mode contrôlé via useState.
 */
export default function ProjectForm({
  categories,
  defaultCategoryId,
  defaultCity,
  defaultDescription,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    submitProject,
    initialState
  );

  // Step initial intelligent : skip auto les étapes déjà remplies via les
  // props (cas embed sur pages listing où catégorie+ville sont connues).
  // Comportement par défaut (sans pré-remplissage) inchangé = step 0.
  const initialStep = defaultCategoryId && defaultCity ? 2 : defaultCategoryId ? 1 : 0;
  const [step, setStep] = useState(initialStep);
  const [categoryId, setCategoryId] = useState<number | null>(
    defaultCategoryId ?? null
  );
  const [cityId, setCityId] = useState<number | null>(defaultCity?.id ?? null);
  const [urgency, setUrgency] = useState<string>("");
  const [budget, setBudget] = useState<string>("");
  // Fix critique : inputs uncontrolled = React reset les valeurs au re-render.
  // Si l'action retourne une erreur (rate limit, validation), l'user voit son
  // formulaire vide et croit que "rien ne se passe". Solution : controlled.
  // Step 4 fields :
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  // Step 3 : description (pour preserver aussi)
  const [description, setDescription] = useState(defaultDescription ?? "");

  // Couverture affichee a l'etape 2 : « 997 maçons référencés en Vienne ».
  // Chargee UNIQUEMENT quand metier ET ville sont connus, donc jamais au
  // chargement de la page — un appel de plus a l'arrivee ralentirait tout le
  // monde pour un encart que personne ne verrait encore.
  const [couverture, setCouverture] = useState<{
    count: number;
    departement: string | null;
  } | null>(null);

  const categoryLabel =
    categories.find((c) => c.id === categoryId)?.name ?? "professionnels";

  useEffect(() => {
    if (!categoryId || !cityId) {
      setCouverture(null);
      return;
    }
    // `annule` : si la personne change de ville pendant le chargement, la
    // reponse de l'ancienne requete ne doit pas ecraser la nouvelle.
    let annule = false;
    fetch(`/api/couverture?categoryId=${categoryId}&cityId=${cityId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!annule && d && typeof d.count === "number") {
          setCouverture({ count: d.count, departement: d.departement ?? null });
        }
      })
      // Silencieux a dessein : c'est un encart de reassurance, pas une etape
      // du parcours. S'il ne charge pas, le formulaire fonctionne a l'identique.
      .catch(() => {});
    return () => {
      annule = true;
    };
  }, [categoryId, cityId]);

  // Fix UX validations :
  // - touched: per-field state (passe a true au onBlur)
  // - hasAttemptedSubmit: passe a true au clic du bouton "Envoyer"
  // - dismissedErrors: champs ou l'user a tape apres un submit failed
  //   (l'erreur Zod stale doit disparaitre quand l'user corrige). On la
  //   ré-affichera apres le prochain submit si elle est toujours invalide.
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set());
  const showError = (field: string): string | undefined => {
    // Pendant la submission, ne PAS afficher d'erreurs : si le serveur retourne
    // success (redirect /merci), les erreurs stales du state precedent ne
    // doivent pas clignoter en rouge pendant la transition. Si le serveur
    // retourne des erreurs, isPending repassera a false et elles s'afficheront
    // proprement. Sans ce check : l'user voit des erreurs rouges sur des champs
    // valides pendant 1-2s avant le redirect, et croit que le form est casse.
    if (isPending) return undefined;
    if (dismissedErrors.has(field)) return undefined;
    return touched[field] || hasAttemptedSubmit
      ? state.errors?.[field as keyof typeof state.errors]
      : undefined;
  };
  const handleBlur = (field: string) =>
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));
  const dismissError = (field: string) => {
    setDismissedErrors((s) => {
      if (s.has(field)) return s;
      const next = new Set(s);
      next.add(field);
      return next;
    });
  };
  // Quand l'user clique submit, on reset dismissedErrors pour que les
  // nouvelles erreurs du serveur (si validation echoue encore) s'affichent.
  const handleAttemptSubmit = () => {
    setHasAttemptedSubmit(true);
    setDismissedErrors(new Set());
  };


  // ── SUIVI DE L'ENTONNOIR — cinq nombres, rien de plus ────────────────────
  //
  // Ce qu'on veut savoir : sur les gens qui ouvrent le formulaire, combien
  // atteignent chaque etape. Cinq nombres (etapes 1 a 4 + envoye), une
  // soustraction entre chaque, et on voit ou ca coupe. C'est tout.
  //
  // Deux defauts corriges le 08/08/2026 :
  //
  // 1. L'ETAPE 1 N'ETAIT JAMAIS ENREGISTREE. `next()` ne tire qu'au clic sur
  //    « Continuer », donc on ne mesurait que les etapes 2, 3 et 4. Le premier
  //    trou — ceux qui ouvrent et ne choisissent meme pas un metier — etait
  //    invisible. On la tire donc a l'ouverture, comme les autres.
  //
  // 2. L'ABANDON VIA `beforeunload` MENTAIT. Les navigateurs modernes ignorent
  //    cet evenement la plupart du temps, surtout sur mobile : 3 abandons
  //    enregistres pour ~189 reels sur 30 jours. Un signal faux est pire que
  //    pas de signal — il donne l'illusion de mesurer. Supprime.
  //    L'abandon se DEDUIT : (etape N) - (etape N+1).
  useEffect(() => {
    trackClient(EVENTS.PROJECT_FORM_STARTED);
    // L'etape de depart n'est pas toujours la 1re : integre dans une page
    // metier/ville, le formulaire demarre deja rempli (etape 2 ou 3). On
    // enregistre donc l'etape REELLE, sinon l'entonnoir compterait des gens
    // a une etape qu'ils n'ont jamais vue.
    trackClient(EVENTS.PROJECT_STEP_REACHED, {
      step: initialStep + 1,
      name: STEPS[initialStep],
    });
  }, []);

  // Validation client minimale pour permettre "Continuer".
  // (la validation serveur Zod reste le filet de sécurité)
  function canProceed(): boolean {
    if (step === 0) return categoryId !== null;
    if (step === 1) return cityId !== null;
    if (step === 2) return urgency !== "" && budget !== "";
    return true;
  }

  function next() {
    if (canProceed()) {
      const target = Math.min(step + 1, STEPS.length - 1);
      setStep(target);
      trackClient(EVENTS.PROJECT_STEP_REACHED, {
        step: target + 1,
        name: STEPS[target],
      });
    }
  }
  function prev() {
    setStep((s) => Math.max(s - 1, 0));
  }

  // Group categories par vertical pour le select de l'étape 1
  const grouped: Record<string, Category[]> = {};
  for (const cat of categories) {
    if (!grouped[cat.vertical]) grouped[cat.vertical] = [];
    grouped[cat.vertical].push(cat);
  }

  const isLast = step === STEPS.length - 1;
  const progressPct = Math.round(((step + 1) / STEPS.length) * 100);

  // Étape 4 (coordonnées) valide ? → active "Envoyer ma demande". Tant que c'est
  // faux, le bouton reste grisé (au lieu de laisser cliquer → mur d'erreurs
  // rouges sur des champs vides). Mêmes règles que le schéma Zod serveur.
  const contactValid =
    firstName.trim().length >= 2 &&
    EMAIL_RE.test(email) &&
    PHONE_RE.test(phone) &&
    consent;

  return (
    <form
      action={formAction}
      onSubmit={() => {
        // Safari fix : declencher handleAttemptSubmit ici (onSubmit) plutot
        // que dans le onClick du bouton. Sur Safari iOS, un setState dans
        // onClick PEUT preempter la submission native si le re-render React
        // arrive avant que Safari traite l'event submit. En faisant le state
        // update dans onSubmit, React garantit que le submit est deja en cours
        // avant le re-render. Marche identiquement sur Chrome.
        setHasAttemptedSubmit(true);
        setDismissedErrors(new Set());
        // Enhanced Conversions Microsoft Ads : on stocke email + phone dans
        // sessionStorage pour que le UETPixel les push à MS Ads sur la page
        // /deposer-projet/merci (= meilleur matching cross-device, +15-30% conv).
        // Normalisation conforme aux specs MS Ads (E.164 phone, lowercase email
        // sans accents). Cleanup auto par le pixel après push. sessionStorage =
        // RGPD-friendly : nettoyé à la fermeture de l'onglet.
        try {
          if (typeof window !== "undefined") {
            const cleanEmail = email
              .trim()
              .toLowerCase()
              .normalize("NFD")
              .replace(/[̀-ͯ]/g, ""); // retire les accents
            const cleanPhone = phone.trim().replace(/[^\d+]/g, ""); // garde + et chiffres
            if (cleanEmail) sessionStorage.setItem("wwv:uet_em", cleanEmail);
            if (cleanPhone) sessionStorage.setItem("wwv:uet_ph", cleanPhone);
          }
        } catch {
          /* sessionStorage peut être bloqué (mode privé Safari, etc.) — pas critique */
        }
      }}
      className="space-y-8"
    >
      {/* Barre de progression */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            Étape {step + 1} sur {STEPS.length} — {STEPS[step]}
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">
            {progressPct}%
          </span>
        </div>
        <div className="h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Message d'erreur global (apres submit serveur). Cache pendant isPending
          pour eviter le clignotement entre un submit precedent qui a echoue et
          le nouveau submit en cours qui peut reussir. */}
      {state.message && !state.success && !isPending && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.message}
          </p>
        </div>
      )}

      {/* ============================================================ */}
      {/* ÉTAPE 1 — Métier                                              */}
      {/* ============================================================ */}
      <div className={step === 0 ? "" : "hidden"}>
        {/* Rappel de ce que l'utilisateur vient d'ecrire dans la barre de
            recherche de l'accueil. Sans ce rappel il arrive ici devant une
            liste vide et croit que sa saisie a ete perdue — c'est ce que Willy
            a constate en testant le 11/08/2026. Le texte etait bien conserve
            (il repart a l'etape 3), mais invisible : donc perdu pour lui. */}
        {defaultDescription && (
          <div className="mb-6 rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] px-4 py-3">
            <p className="text-sm text-[var(--text-secondary)]">
              Votre demande&nbsp;:{" "}
              <span className="text-[var(--text-primary)] font-medium">
                &laquo;&nbsp;{defaultDescription}&nbsp;&raquo;
              </span>
              {defaultCity ? ` a ${defaultCity.name}` : ""}. Nous l&apos;avons
              gardee — indiquez juste le metier concerne.
            </p>
          </div>
        )}
        <label
          htmlFor="categoryId"
          className="block text-base font-medium text-[var(--text-primary)] mb-3"
        >
          Quel type de travaux ?
        </label>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Choisissez le métier dont vous avez besoin.
        </p>
        <select
          id="categoryId"
          name="categoryId"
          value={categoryId ?? ""}
          onChange={(e) =>
            setCategoryId(e.target.value ? Number(e.target.value) : null)
          }
          className={`w-full h-12 px-4 rounded-xl border bg-[var(--bg-primary)] text-[var(--text-primary)] transition-all duration-250 outline-none appearance-none cursor-pointer ${
            state.errors?.categoryId
              ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          }`}
        >
          <option value="" disabled>
            Choisissez un métier...
          </option>
          {(["btp", "domicile", "personne"] as const).map((vertical) =>
            grouped[vertical] ? (
              <optgroup key={vertical} label={VERTICAL_LABELS[vertical]}>
                {grouped[vertical].map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </optgroup>
            ) : null
          )}
        </select>
        {state.errors?.categoryId && (
          <p className="mt-1.5 text-sm text-red-500">
            {state.errors.categoryId}
          </p>
        )}
      </div>

      {/* ============================================================ */}
      {/* ÉTAPE 2 — Ville                                               */}
      {/* ============================================================ */}
      <div className={step === 1 ? "" : "hidden"}>
        <label className="block text-base font-medium text-[var(--text-primary)] mb-3">
          Dans quelle ville ?
        </label>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Lieu de l&apos;intervention. Tapez les premières lettres.
        </p>
        <CityAutocomplete
          onSelect={(id) => setCityId(id)}
          error={state.errors?.cityId}
          defaultCity={defaultCity}
        />
        <input type="hidden" name="cityId" value={cityId ?? ""} />

        {/* Confirmation de couverture — le seul moment du formulaire où le site
            répond à la personne au lieu de lui demander quelque chose. Elle
            vient de donner sa ville : on lui prouve qu'on couvre chez elle,
            avec un chiffre vrai tiré de la base.
            « référencés » et pas « disponibles » : ce sont les entreprises du
            registre officiel, pas une promesse de réponse. */}
        {couverture && couverture.count > 0 && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-4 py-3 text-sm text-[var(--text-primary)]">
            <span className="text-[var(--accent)] font-bold leading-5" aria-hidden>
              ✓
            </span>
            {/* Formulation volontairement « <Métier> — N professionnels » :
                accorder le nom de métier au pluriel est impossible proprement
                sur les 197 catégories (« Débarras » et « Garde d'enfants »
                sont déjà pluriels, « Ménage » donnerait « 997 ménages », qui
                ne veut rien dire). « professionnels » est juste partout. */}
            <span>
              <strong>
                {categoryLabel} — {couverture.count.toLocaleString("fr-FR")}{" "}
                professionnels référencés
              </strong>
              {couverture.departement ? ` en ${couverture.departement}` : ""}.
              <span className="block text-[var(--text-secondary)]">
                Votre demande partira à ceux qui interviennent dans votre secteur.
              </span>
            </span>
          </p>
        )}
      </div>

      {/* ============================================================ */}
      {/* ÉTAPE 3 — Projet (description optionnelle + urgence + budget) */}
      {/* ============================================================ */}
      <div className={step === 2 ? "" : "hidden"}>
        <label className="block text-base font-medium text-[var(--text-primary)] mb-3">
          Votre projet
        </label>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Donnez quelques éléments pour aider les artisans à comprendre votre
          besoin.
        </p>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-[var(--text-primary)] mb-2"
            >
              Description{" "}
              <span className="text-[var(--text-tertiary)] font-normal">
                (optionnelle)
              </span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Type de travaux, surface, contraintes... Laissez vide si vous préférez, les artisans vous rappelleront pour préciser."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                dismissError("description");
              }}
              onBlur={() => handleBlur("description")}
              className={`w-full px-4 py-3 rounded-xl border bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-250 outline-none resize-y ${
                showError("description")
                  ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              }`}
            />
            {showError("description") && (
              <p className="mt-1.5 text-sm text-red-500">
                {showError("description")}
              </p>
            )}
          </div>

          <fieldset>
            <legend className="block text-sm font-medium text-[var(--text-primary)] mb-3">
              Urgence
            </legend>
            <div className="flex flex-wrap gap-2">
              {URGENCY_OPTIONS.map((opt) => (
                <label key={opt.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="urgency"
                    value={opt.value}
                    checked={urgency === opt.value}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="peer sr-only"
                  />
                  <span className="inline-block px-4 py-2.5 rounded-full text-sm font-medium border border-[var(--border-color)] text-[var(--text-secondary)] bg-[var(--bg-primary)] transition-all duration-250 peer-checked:bg-[var(--accent)] peer-checked:text-white peer-checked:border-[var(--accent)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent)]/40 hover:border-[var(--text-tertiary)]">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
            {state.errors?.urgency && (
              <p className="mt-1.5 text-sm text-red-500">
                {state.errors.urgency}
              </p>
            )}
          </fieldset>

          {/* Budget en pastilles, comme l'urgence juste au-dessus.
              Avant : un menu déroulant — trois gestes (ouvrir, faire défiler,
              choisir) là où l'urgence n'en demande qu'un, et un rythme cassé au
              milieu de la même étape. « Je ne sais pas » est mis en avant comme
              une réponse normale : c'est le cas le plus fréquent, et le
              présenter comme un choix légitime évite qu'on renonce ici. */}
          <fieldset>
            <legend className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Budget estimé
            </legend>
            <p className="text-[13px] text-[var(--text-secondary)] mb-3">
              Une fourchette suffit. Ça aide l&apos;artisan à vous proposer
              quelque chose de réaliste.
            </p>
            <div className="flex flex-wrap gap-2">
              {BUDGET_OPTIONS.map((opt) => (
                <label key={opt.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="budget"
                    value={opt.value}
                    checked={budget === opt.value}
                    onChange={(e) => setBudget(e.target.value)}
                    className="peer sr-only"
                  />
                  <span className="inline-block px-4 py-2.5 rounded-full text-sm font-medium border border-[var(--border-color)] text-[var(--text-secondary)] bg-[var(--bg-primary)] transition-all duration-250 peer-checked:bg-[var(--accent)] peer-checked:text-white peer-checked:border-[var(--accent)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent)]/40 hover:border-[var(--text-tertiary)]">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
            {state.errors?.budget && (
              <p className="mt-1.5 text-sm text-red-500">
                {state.errors.budget}
              </p>
            )}
          </fieldset>
        </div>
      </div>

      {/* ============================================================ */}
      {/* ÉTAPE 4 — Coordonnées + RGPD + Submit                         */}
      {/* ============================================================ */}
      <div className={step === 3 ? "" : "hidden"}>
        <label className="block text-base font-medium text-[var(--text-primary)] mb-3">
          Vos coordonnées
        </label>
        <p className="text-sm text-[var(--text-secondary)] mb-5">
          Pour que le bon artisan puisse vous envoyer son devis. Dernière étape,
          c&apos;est presque fini.
        </p>

        {/* Réassurance données — pile au moment où l'utilisateur hésite à
            laisser email + téléphone. Tous les points sont VRAIS :
            - coordonnées derrière un paywall pro (9,90€ à l'unlock), jamais
              publiques ni vendues (cf. broadcast-btp-project.ts) ;
            - aucun démarchage Workwave ;
            - suppression via le lien du mail de confirmation (deletion_token,
              cf. deposer-projet/actions.ts + sendProjectConfirmation). */}
        <div className="mb-6 rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 text-[var(--accent)] shrink-0"
              aria-hidden
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Vos données sont protégées
            </span>
          </div>
          {/* Deux lignes, pas six. L'encadre disait trois fois la meme chose :
              a l'endroit ou la personne hesite le plus, un mur de texte se
              saute au lieu de se lire. */}
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Vos coordonnées ne sont visibles que par un artisan qui décide de
            traiter votre demande. Jamais affichées sur le site, jamais
            revendues, et Workwave ne s&apos;en sert jamais pour vous démarcher.
          </p>
          <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
            Vous pouvez supprimer votre demande quand vous voulez — le lien est
            dans l&apos;email de confirmation.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-[var(--text-primary)] mb-2"
            >
              Prénom
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Jean"
              value={firstName}
              onBlur={() => handleBlur("firstName")}
              onChange={(e) => {
                setFirstName(e.target.value);
                dismissError("firstName");
              }}
              className={`w-full h-12 px-4 rounded-xl border bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-250 outline-none ${
                showError("firstName")
                  ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              }`}
            />
            {showError("firstName") && (
              <p className="mt-1.5 text-sm text-red-500">
                {showError("firstName")}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--text-primary)] mb-2"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="jean@exemple.fr"
              value={email}
              onBlur={() => handleBlur("email")}
              onChange={(e) => {
                setEmail(e.target.value);
                dismissError("email");
              }}
              className={`w-full h-12 px-4 rounded-xl border bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-250 outline-none ${
                showError("email")
                  ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              }`}
            />
            {showError("email") && (
              <p className="mt-1.5 text-sm text-red-500">{showError("email")}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-[var(--text-primary)] mb-1"
            >
              Téléphone
            </label>
            {/* La raison, a l'endroit exact ou la personne hesite. Un champ
                telephone sans justification est le point de blocage classique
                d'un formulaire de mise en relation : on repond a la question
                avant qu'elle soit posee. */}
            <p className="text-[13px] text-[var(--text-secondary)] mb-2">
              La plupart des artisans rappellent plutôt que d&apos;écrire.
            </p>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="06 12 34 56 78"
              value={phone}
              onBlur={() => handleBlur("phone")}
              onChange={(e) => {
                setPhone(e.target.value);
                dismissError("phone");
              }}
              className={`w-full h-12 px-4 rounded-xl border bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-250 outline-none ${
                showError("phone")
                  ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              }`}
            />
            {showError("phone") && (
              <p className="mt-1.5 text-sm text-red-500">{showError("phone")}</p>
            )}
          </div>

          <div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="consent"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  dismissError("consent");
                }}
                className="mt-0.5 h-5 w-5 rounded border-[var(--border-color)] text-[var(--accent)] focus:ring-[var(--accent)]/20 cursor-pointer"
              />
              <span className="text-sm text-[var(--text-secondary)] leading-relaxed">
                J&apos;accepte que mes données soient transmises aux
                professionnels concernés pour traiter ma demande.{" "}
                <a
                  href="/mentions-legales"
                  className="underline hover:text-[var(--accent)] transition-colors duration-250"
                >
                  Voir nos mentions légales
                </a>
              </span>
            </label>
            {showError("consent") && (
              <p className="mt-1.5 text-sm text-red-500">
                {showError("consent")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Honeypot (anti-bot, invisible) */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] opacity-0 h-0 overflow-hidden"
      >
        <label htmlFor="website">Ne pas remplir</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Indice doux (gris, pas rouge) quand le bouton Envoyer est grisé :
          explique ce qui reste à remplir SANS crier en rouge sur des champs
          vides. N'apparaît qu'à l'étape Contact tant que ce n'est pas valide. */}
      {isLast && !contactValid && (
        <p className="text-sm text-[var(--text-tertiary)]">
          Il manque&nbsp;:{" "}
          {[
            firstName.trim().length < 2 ? "votre prénom" : null,
            !EMAIL_RE.test(email.trim()) ? "votre email" : null,
            !PHONE_RE.test(phone.trim()) ? "votre téléphone" : null,
            !consent ? "votre accord (case à cocher)" : null,
          ]
            .filter(Boolean)
            .join(", ")}
          .
        </p>
      )}

      {/* Navigation entre étapes */}
      <div className="flex items-center justify-between gap-3 pt-6 border-t border-[var(--border-color)]">
        {step > 0 ? (
          <button
            type="button"
            onClick={prev}
            className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-250"
          >
            ← Précédent
          </button>
        ) : (
          <span />
        )}

        {!isLast ? (
          <button
            type="button"
            onClick={next}
            disabled={!canProceed()}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-full text-sm transition-all duration-250 hover:scale-[1.02] disabled:hover:scale-100"
          >
            Continuer →
          </button>
        ) : (
          <button
            type="submit"
            disabled={isPending || !contactValid}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white px-10 py-3.5 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02] disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Envoi en cours...
              </>
            ) : (
              "Envoyer ma demande"
            )}
          </button>
        )}
      </div>
    </form>
  );
}
