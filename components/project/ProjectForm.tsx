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

// Metiers les plus demandes, MESURES sur les 132 projets deja deposes
// (28/08/2026) : Macon 18, Plombier 9, Couvreur 8, Nettoyage vitres 8,
// Electricien 7, Menuisier 7, Carreleur 7, Garde animaux 7, Plaquiste 6,
// Chauffagiste 6, Menage 5, Debarras 4.
//
// Sert a deux endroits : les exemples cites sur chaque porte, et l'ordre des
// boutons a l'ecran 2. Sans ce tri, l'ordre est alphabetique et la porte
// « Bâtiment » s'annonce par « Architecte, Ascensoriste… », qui ne parle a
// personne, au lieu de « Maçon, plombier, couvreur… ».
//
// A remesurer quand le volume de projets aura change d'ordre de grandeur :
// npx tsx scripts/_diag-motscles.ts
const POPULAIRES = [
  "Maçon",
  "Plombier",
  "Couvreur",
  "Électricien",
  "Menuisier",
  "Carreleur",
  "Nettoyage vitres",
  "Garde animaux",
  "Plaquiste",
  "Chauffagiste",
  "Ménage",
  "Débarras",
  "Peintre",
  "Serrurier",
  "Garde d'enfants",
  "Aide aux seniors",
  "Déménagement",
  "Soutien scolaire",
];

function rangPopularite(nom: string): number {
  const i = POPULAIRES.indexOf(nom);
  return i === -1 ? POPULAIRES.length : i;
}

// Les trois portes du premier ecran. Formules du point de vue du particulier
// (« Bâtiment et travaux »), pas du decoupage interne de la base (« btp »).
const FAMILY_LABELS: Record<string, string> = {
  btp: "Bâtiment et travaux",
  domicile: "Entretien de la maison",
  personne: "Aide à la personne",
};

const URGENCY_OPTIONS = [
  { value: "today", label: "Aujourd'hui" },
  { value: "this_week", label: "Cette semaine" },
  { value: "this_month", label: "Ce mois-ci" },
  { value: "not_urgent", label: "Pas pressé" },
];

// 28/08/2026 : la question du budget est SUPPRIMEE du formulaire. Mesure sur
// les 132 projets deposes : 38 % repondaient « moins de 500 € » (la premiere
// option de la liste, donc largement du clic par defaut) et 33 % « je ne sais
// pas ». 71 % de reponses inexploitables, et une donnee fausse est pire que
// pas de donnee : un artisan qui lit « moins de 500 € » sur un chantier a
// 3 000 € ne debloque pas le lead, et la vente est perdue sur un champ mal
// rempli.
//
// La colonne `budget` reste NOT NULL en base et le schema Zod l'exige toujours
// (cf. deposer-projet/actions.ts) : on envoie donc « unknown » en champ cache,
// valeur deja acceptee par l'enum. Aucun changement de schema, aucun risque
// sur la soumission.
const BUDGET_ABSENT = "unknown";

// 28/08/2026 : cinq ecrans au lieu de quatre. Une question par ecran, et le
// clic vaut validation quand la reponse est un choix (famille, metier, quand) :
// plus de bouton « Continuer » a presser derriere. Le bouton ne survit que la
// ou l'on ECRIT (projet, coordonnees), sinon on ne sait pas quand la personne
// a fini de taper. Mesure qui a declenche la refonte : 408 formulaires
// commences sur 60 jours, 117 termines, soit 71 % d'abandon.
const STEPS = ["Besoin", "Métier", "Quand", "Projet", "Coordonnées"];
const initialState: FormState = { success: false };

// Validation client des coordonnées (étape 4), alignée sur le schéma Zod serveur
// (cf. deposer-projet/actions.ts). Sert UNIQUEMENT à activer/griser le bouton
// "Envoyer ma demande", pas à afficher des erreurs. Évite le "mur rouge" quand
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
  // Le formulaire integre dans une page metier/ville arrive deja rempli : on
  // saute alors les deux ecrans de choix et on demarre a « Quand ». La ville
  // n'avance plus le depart : elle est passee au DERNIER ecran, avec les
  // coordonnees, donc un defaultCity ne fait que pre-remplir un champ.
  const initialStep = defaultCategoryId ? 2 : 0;
  const [step, setStep] = useState(initialStep);
  const [categoryId, setCategoryId] = useState<number | null>(
    defaultCategoryId ?? null
  );
  const [cityId, setCityId] = useState<number | null>(defaultCity?.id ?? null);
  const [urgency, setUrgency] = useState<string>("");
  // Famille de metiers choisie a l'ecran 1 (btp / domicile / personne). Sert a
  // n'afficher a l'ecran 2 que les metiers de cette famille, au lieu des 57
  // d'un seul menu deroulant.
  const [vertical, setVertical] = useState<string>("");
  // 28/08/2026 : un particulier qui renove a souvent besoin de PLUSIEURS corps
  // de metier (« un plombier, un macon et un electricien »). L'ecran 2 accepte
  // donc plusieurs metiers, et le serveur cree un projet DISTINCT par metier :
  // chacun part aux bons artisans et se debloque separement. Sur la meme
  // demande et le meme visiteur, trois projets valent trois deblocages
  // possibles au lieu d'un.
  //
  // `categoryId` (le premier choisi) reste le metier principal : il porte la
  // redirection, le mail de confirmation et toute la compatibilite existante.
  const [extraCategoryIds, setExtraCategoryIds] = useState<number[]>([]);
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
  // chargement de la page : un appel de plus a l'arrivee ralentirait tout le
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


  // ── SUIVI DE L'ENTONNOIR · cinq nombres, rien de plus ────────────────────
  //
  // Ce qu'on veut savoir : sur les gens qui ouvrent le formulaire, combien
  // atteignent chaque etape. Cinq nombres (etapes 1 a 4 + envoye), une
  // soustraction entre chaque, et on voit ou ca coupe. C'est tout.
  //
  // Deux defauts corriges le 08/08/2026 :
  //
  // 1. L'ETAPE 1 N'ETAIT JAMAIS ENREGISTREE. `next()` ne tire qu'au clic sur
  //    « Continuer », donc on ne mesurait que les etapes 2, 3 et 4. Le premier
  //    trou (ceux qui ouvrent et ne choisissent meme pas un metier) etait
  //    invisible. On la tire donc a l'ouverture, comme les autres.
  //
  // 2. L'ABANDON VIA `beforeunload` MENTAIT. Les navigateurs modernes ignorent
  //    cet evenement la plupart du temps, surtout sur mobile : 3 abandons
  //    enregistres pour ~189 reels sur 30 jours. Un signal faux est pire que
  //    pas de signal : il donne l'illusion de mesurer. Supprime.
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
    if (step === 0) return vertical !== "";
    if (step === 1) return categoryId !== null;
    if (step === 2) return urgency !== "";
    // 19/08/2026 : la description est OBLIGATOIRE, et le blocage se fait ICI,
    // sur le bouton "Continuer", jamais a l'envoi final. Raison : le formulaire
    // est en plusieurs etapes ; une erreur serveur sur un champ d'une etape
    // MASQUEE produisait un echec silencieux (l'utilisateur cliquait "Envoyer"
    // et il ne se passait rien). En bloquant a l'etape, il voit tout de suite
    // ce qui manque, sous les yeux.
    if (step === 3) return description.trim().length >= 20;
    return true;
  }

  /** Tous les metiers choisis, le principal en tete. */
  function metiersChoisis(): number[] {
    return categoryId === null ? [] : [categoryId, ...extraCategoryIds];
  }
  function estChoisi(id: number): boolean {
    return metiersChoisis().includes(id);
  }
  /** Ajoute ou retire un metier. Le premier choisi devient le principal ; si on
   *  le retire, le suivant prend sa place, pour que `categoryId` ne soit jamais
   *  vide tant qu'il reste au moins un metier. */
  function basculerMetier(id: number) {
    const actuels = metiersChoisis();
    const apres = actuels.includes(id)
      ? actuels.filter((x) => x !== id)
      : [...actuels, id];
    setCategoryId(apres.length ? apres[0] : null);
    setExtraCategoryIds(apres.slice(1));
  }

  /** Avance vers une etape precise. Utilise par les ecrans a choix, ou le clic
   *  sur la reponse vaut validation : on ne repasse pas par canProceed(), qui
   *  lirait un state pas encore commite par React. */
  function goTo(target: number) {
    const t = Math.min(Math.max(target, 0), STEPS.length - 1);
    setStep(t);
    remonterAuFormulaire();
    trackClient(EVENTS.PROJECT_STEP_REACHED, { step: t + 1, name: STEPS[t] });
  }

  /** Ramene la barre de progression en haut de l'ecran a chaque changement
   *  d'etape. Sans ca, le visiteur retombe sur le titre de la page et son
   *  sous-titre (450 px sur un telephone) et doit redefiler pour retrouver la
   *  question, a CHAQUE etape. Constate sur les captures du 28/08/2026 : c'est
   *  le meme defaut que les quatre cartes de confiance, en plus discret.
   *  `block: "start"` et non `center` : on veut la barre en haut, pas au
   *  milieu, sinon la question passe sous la ligne de flottaison. */
  function remonterAuFormulaire() {
    if (typeof window === "undefined") return;
    requestAnimationFrame(() => {
      document
        .getElementById("depot-progression")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function next() {
    if (canProceed()) {
      const target = Math.min(step + 1, STEPS.length - 1);
      setStep(target);
      remonterAuFormulaire();
      trackClient(EVENTS.PROJECT_STEP_REACHED, {
        step: target + 1,
        name: STEPS[target],
      });
    }
  }
  function prev() {
    setStep((s) => Math.max(s - 1, 0));
    remonterAuFormulaire();
  }

  // Group categories par vertical pour le select de l'étape 1
  const grouped: Record<string, Category[]> = {};
  for (const cat of categories) {
    if (!grouped[cat.vertical]) grouped[cat.vertical] = [];
    grouped[cat.vertical].push(cat);
  }
  // Les plus demandes d'abord, le reste par ordre alphabetique. Vaut pour les
  // exemples cites sur les portes ET pour l'ordre des boutons a l'ecran 2.
  for (const v of Object.keys(grouped)) {
    grouped[v].sort((a, b) => {
      const d = rangPopularite(a.name) - rangPopularite(b.name);
      return d !== 0 ? d : a.name.localeCompare(b.name, "fr");
    });
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
          /* sessionStorage peut être bloqué (mode privé Safari, etc.), pas critique */
        }
      }}
      className="space-y-8"
    >
      {/* Barre de progression. L'id sert d'ancre au defilement automatique
          entre etapes (cf. remonterAuFormulaire). */}
      <div id="depot-progression" className="scroll-mt-20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            Étape {step + 1} sur {STEPS.length} · {STEPS[step]}
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
      {/* ÉCRAN 1 · La famille de métiers                               */}
      {/* ============================================================ */}
      {/* Avant le 28/08/2026 : un menu deroulant de 57 metiers, sans recherche,
          en toute premiere question. Sur un telephone c'est un rouleau
          interminable. Trois portes guident sans noyer, et le clic vaut
          validation : on passe directement aux metiers de la famille. */}
      <div className={step === 0 ? "" : "hidden"}>
        {defaultDescription && (
          <div className="mb-6 rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] px-4 py-3">
            <p className="text-sm text-[var(--text-secondary)]">
              Votre demande&nbsp;:{" "}
              <span className="text-[var(--text-primary)] font-medium">
                &laquo;&nbsp;{defaultDescription}&nbsp;&raquo;
              </span>
              {defaultCity ? ` à ${defaultCity.name}` : ""}. Nous l&apos;avons
              gardée : indiquez juste le métier concerné.
            </p>
          </div>
        )}
        <label className="block text-base font-medium text-[var(--text-primary)] mb-1">
          Quel type de travaux ?
        </label>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Gratuit, sans engagement.
        </p>

        <div className="space-y-3">
          {(["btp", "domicile", "personne"] as const).map((v) =>
            grouped[v]?.length ? (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setVertical(v);
                  goTo(1);
                }}
                className="w-full text-left rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-5 py-4 transition-all duration-250 hover:border-[var(--accent)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
              >
                <span className="block text-base font-semibold text-[var(--text-primary)]">
                  {FAMILY_LABELS[v]}
                </span>
                <span className="mt-1 block text-sm text-[var(--text-secondary)]">
                  {grouped[v]
                    .slice(0, 4)
                    .map((c, i) => (i === 0 ? c.name : c.name.toLowerCase()))
                    .join(", ")}
                  … {grouped[v].length} métiers
                </span>
              </button>
            ) : null
          )}
        </div>

        {/* Reassurance affichee UNE SEULE FOIS, ici. Avant le 28/08/2026 elle
            occupait quatre grandes cartes AU-DESSUS du formulaire, reaffichees
            a chaque etape : sur mobile, aucun champ n'etait visible sans
            defiler, a aucune etape. Le fond est conserve, le volume non. */}
        <ul className="mt-6 flex flex-wrap gap-2">
          {[
            "Gratuit",
            "Sans engagement",
            "SIRET vérifié",
            "Numéro jamais affiché",
          ].map((t) => (
            <li
              key={t}
              className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1.5 text-[13px] font-medium text-[var(--text-primary)]"
            >
              <span className="text-[var(--accent)] font-bold" aria-hidden>
                ✓
              </span>{" "}
              {t}
            </li>
          ))}
        </ul>

        {state.errors?.categoryId && (
          <p className="mt-1.5 text-sm text-red-500">
            {state.errors.categoryId}
          </p>
        )}
      </div>

      {/* ============================================================ */}
      {/* ÉCRAN 2 · Le métier, dans la famille choisie                  */}
      {/* ============================================================ */}
      <div className={step === 1 ? "" : "hidden"}>
        <button
          type="button"
          onClick={() => goTo(0)}
          className="mb-4 rounded-full border border-[var(--border-color)] px-3 py-1.5 text-[13px] text-[var(--text-secondary)] transition-colors duration-250 hover:text-[var(--text-primary)]"
        >
          ← Changer de besoin
        </button>
        <label className="block text-base font-medium text-[var(--text-primary)] mb-1">
          {vertical ? FAMILY_LABELS[vertical] : "Choisissez votre métier"}
        </label>
        {/* L'invitation au choix multiple doit etre lisible AVANT le premier
            clic : sinon personne ne devine qu'on peut en cocher plusieurs, et
            la fonctionnalite ne sert a rien. Elle est donc dans l'aide, et
            repetee sous le bouton une fois un metier choisi. */}
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Touchez <strong className="text-[var(--text-primary)] font-semibold">un ou plusieurs métiers</strong>. Une demande partira pour chacun.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(grouped[vertical] ?? []).map((cat) => (
            <button
              key={cat.id}
              type="button"
              aria-pressed={estChoisi(cat.id)}
              onClick={() => basculerMetier(cat.id)}
              className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                estChoisi(cat.id)
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-primary)]"
                  : "border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-[var(--accent)]"
              }`}
            >
              {estChoisi(cat.id) ? (
                <span className="text-[var(--accent)] font-bold mr-1.5" aria-hidden>
                  ✓
                </span>
              ) : null}
              {cat.name}
            </button>
          ))}
        </div>
        {/* Les metiers partent au serveur par ces champs caches : les boutons
            ci-dessus ne sont pas des <input>, et la Server Action lit le
            FormData. `categoryId` = le metier principal (compatibilite avec
            tout l'existant), `categoryIds` = la liste complete. */}
        <input type="hidden" name="categoryId" value={categoryId ?? ""} />
        <input type="hidden" name="categoryIds" value={metiersChoisis().join(",")} />

        {/* Ici le clic ne peut plus valider tout seul : il faut pouvoir en
            choisir plusieurs. Le bouton n'apparait qu'une fois un metier
            choisi, et dit combien de demandes vont partir. */}
        {categoryId !== null && (
          <div className="mt-5">
            <button
              type="button"
              onClick={() => goTo(2)}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-6 py-3.5 rounded-full text-sm transition-all duration-250 hover:scale-[1.01]"
            >
              {metiersChoisis().length > 1
                ? `Continuer avec ${metiersChoisis().length} métiers →`
                : "Continuer →"}
            </button>
            <p className="mt-2.5 text-center text-[13px] text-[var(--text-secondary)]">
              {metiersChoisis().length > 1
                ? `Vous pouvez en choisir plusieurs : ${metiersChoisis().length} demandes distinctes partiront, une par métier.`
                : "Besoin d’un autre corps de métier ? Touchez-en autant que nécessaire, une demande partira pour chacun."}
            </p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* ÉCRAN 5a · La ville, réunie avec les coordonnées               */}
      {/* ============================================================ */}
      {/* 28/08/2026 : la ville passe de l'ecran 2 au dernier ecran, avec les
          coordonnees. Deux effets : le clavier ne s'ouvre qu'a partir de
          l'ecran 4, et la preuve chiffree (« Maçon · 997 professionnels
          référencés en Vienne ») arrive juste au-dessus du champ telephone,
          c'est-a-dire pile au moment ou la personne se demande si donner son
          numero sert a quelque chose. */}
      <div className={step === 4 ? "" : "hidden"}>
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

        {/* Confirmation de couverture : le seul moment du formulaire où le site
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
            {/* Formulation volontairement « <Métier> · N professionnels » :
                accorder le nom de métier au pluriel est impossible proprement
                sur les 197 catégories (« Débarras » et « Garde d'enfants »
                sont déjà pluriels, « Ménage » donnerait « 997 ménages », qui
                ne veut rien dire). « professionnels » est juste partout. */}
            <span>
              <strong>
                {categoryLabel} · {couverture.count.toLocaleString("fr-FR")}{" "}
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
      {/* ÉCRAN 3 · Quand                                               */}
      {/* ============================================================ */}
      {/* Le clic vaut validation : la reponse fait avancer, sans bouton a
          presser derriere sur un ecran ou l'on a deja repondu. */}
      <div className={step === 2 ? "" : "hidden"}>
        <button
          type="button"
          onClick={() => goTo(1)}
          className="mb-4 rounded-full border border-[var(--border-color)] px-3 py-1.5 text-[13px] text-[var(--text-secondary)] transition-colors duration-250 hover:text-[var(--text-primary)]"
        >
          ← Retour
        </button>
        <label className="block text-base font-medium text-[var(--text-primary)] mb-1">
          C&apos;est pour quand ?
        </label>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Une idée suffit.
        </p>
        <div className="flex flex-wrap gap-2">
          {URGENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setUrgency(opt.value);
                goTo(3);
              }}
              className={`rounded-full border px-5 py-3 text-sm font-medium transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                urgency === opt.value
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-[var(--accent)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {/* L'urgence part au serveur par ce champ cache (les boutons ci-dessus
            ne sont pas des <input> : ils valident ET font avancer). */}
        <input type="hidden" name="urgency" value={urgency} />
        {/* Budget : question retiree du formulaire le 28/08/2026, valeur
            neutre conservee pour le schema serveur (cf. BUDGET_ABSENT). */}
        <input type="hidden" name="budget" value={BUDGET_ABSENT} />
        {state.errors?.urgency && (
          <p className="mt-2 text-sm text-red-500">{state.errors.urgency}</p>
        )}
      </div>

      {/* ============================================================ */}
      {/* ÉCRAN 4 · Le chantier (description obligatoire)               */}
      {/* ============================================================ */}
      <div className={step === 3 ? "" : "hidden"}>
        <label className="block text-base font-medium text-[var(--text-primary)] mb-1">
          Décrivez votre chantier
        </label>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Plus vous êtes précis, plus les artisans qui vous rappellent sont les
          bons. Deux phrases suffisent : ce qu&apos;il y a à faire, et où.
        </p>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-[var(--text-primary)] mb-2"
            >
              Décrivez votre projet
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder={"Exemple : refaire le carrelage de la salle de bain, environ 8 m\u00b2, l\u0027ancien carrelage est \u00e0 d\u00e9poser. Logement occup\u00e9."}
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
            {showError("description") ? (
              <p className="mt-1.5 text-sm text-red-500">
                {showError("description")}
              </p>
            ) : description.trim().length > 0 && description.trim().length < 20 ? (
              <p className="mt-1.5 text-sm text-[var(--text-tertiary)]">
                Encore {20 - description.trim().length} caractère
                {20 - description.trim().length > 1 ? "s" : ""} pour que les
                artisans comprennent votre besoin.
              </p>
            ) : null}
          </div>
      </div>

      {/* ============================================================ */}
      {/* ÉCRAN 5b · Coordonnées + RGPD + Submit                        */}
      {/* ============================================================ */}
      <div className={step === 4 ? "" : "hidden"}>
        <label className="block text-base font-medium text-[var(--text-primary)] mb-3">
          Vos coordonnées
        </label>
        <p className="text-sm text-[var(--text-secondary)] mb-5">
          Pour que le bon artisan puisse vous envoyer son devis. Dernière étape,
          c&apos;est presque fini.
        </p>

        {/* Réassurance données, pile au moment où l'utilisateur hésite à
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
            Visibles uniquement par l&apos;artisan qui traite votre demande.
            Jamais affichées, jamais revendues. Suppression en un clic depuis
            l&apos;email de confirmation.
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

      {/* Navigation entre étapes.
          28/08/2026 : la barre ne s'affiche plus QUE sur les deux ecrans ou
          l'on ECRIT (le chantier, puis les coordonnees). Sur les trois
          premiers, la reponse est un choix : le clic valide et fait avancer,
          un bouton « Continuer » y serait un geste de plus sur un ecran ou la
          personne a deja repondu. Le retour y est un bouton en haut d'ecran,
          visible sans defiler. */}
      <div
        className={`items-center justify-between gap-3 pt-6 border-t border-[var(--border-color)] ${
          step >= 3 ? "flex" : "hidden"
        }`}
      >
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
