"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
  const [description, setDescription] = useState("");

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

  // Tracking : start + abandon
  const isDirty = useRef(false);
  const submitted = useRef(false);

  useEffect(() => {
    trackClient(EVENTS.PROJECT_FORM_STARTED);

    function handleBeforeUnload() {
      if (isDirty.current && !submitted.current) {
        trackClient(EVENTS.PROJECT_FORM_ABANDONED);
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
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
      isDirty.current = true;
      // Tracking par étape : on saura ainsi OÙ, précisément, les ~92 %
      // d'abandons se produisent (Ville ? Projet ? Contact ?).
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
      onChange={() => {
        isDirty.current = true;
      }}
      onSubmit={() => {
        // Safari fix : declencher handleAttemptSubmit ici (onSubmit) plutot
        // que dans le onClick du bouton. Sur Safari iOS, un setState dans
        // onClick PEUT preempter la submission native si le re-render React
        // arrive avant que Safari traite l'event submit. En faisant le state
        // update dans onSubmit, React garantit que le submit est deja en cours
        // avant le re-render. Marche identiquement sur Chrome.
        submitted.current = true;
        setHasAttemptedSubmit(true);
        setDismissedErrors(new Set());
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

          <div>
            <label
              htmlFor="budget"
              className="block text-sm font-medium text-[var(--text-primary)] mb-2"
            >
              Budget estimé
            </label>
            <select
              id="budget"
              name="budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className={`w-full h-12 px-4 rounded-xl border bg-[var(--bg-primary)] text-[var(--text-primary)] transition-all duration-250 outline-none appearance-none cursor-pointer ${
                state.errors?.budget
                  ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              }`}
            >
              <option value="" disabled>
                Sélectionnez un budget...
              </option>
              {BUDGET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {state.errors?.budget && (
              <p className="mt-1.5 text-sm text-red-500">
                {state.errors.budget}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* ÉTAPE 4 — Coordonnées + RGPD + Submit                         */}
      {/* ============================================================ */}
      <div className={step === 3 ? "" : "hidden"}>
        <label className="block text-base font-medium text-[var(--text-primary)] mb-3">
          Vos coordonnées
        </label>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Pour que les artisans puissent vous contacter directement. Workwave
          ne vous spammera pas.
        </p>

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
              className="block text-sm font-medium text-[var(--text-primary)] mb-2"
            >
              Téléphone
            </label>
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
          Renseignez votre prénom, votre email et votre téléphone, puis cochez la
          case pour envoyer votre demande.
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
