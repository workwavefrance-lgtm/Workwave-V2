"use client";

import { useState, useActionState, useRef, useEffect } from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import { useDashboard } from "@/components/pro/dashboard/DashboardProvider";
import {
  updateProProfile,
  uploadProCover,
  deleteProCover,
  saveProPhotoCaption,
  uploadProLogo,
  uploadProPhoto,
  deleteProPhoto,
  type ProfileFormState,
  type UploadState,
} from "@/app/pro/dashboard/fiche/actions";
import type { Certification, PaymentMethod, OpeningHours } from "@/lib/types/database";
import type { CategoryOption } from "@/lib/queries/categories";

type Props = {
  // Liste allégée (id/name/vertical) : voir getCategoriesForPicker. La liste
  // complète représentait 60-150 Ko de JSON envoyés au téléphone pour un menu.
  categories: CategoryOption[];
};

const CERTIFICATIONS: Certification[] = [
  "RGE",
  "Qualibat",
  "Qualigaz",
  "QualiPAC",
  "QualiPV",
  "QualiSol",
  "QualiBois",
  "Artisan d'Art",
  "Eco-Artisan",
  "Handibat",
  "PRO de la Performance Énergétique",
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CB", label: "Carte bancaire" },
  { value: "virement", label: "Virement" },
  { value: "cheque", label: "Chèque" },
  { value: "especes", label: "Espèces" },
];

const DAYS = [
  { key: "lundi", label: "Lundi" },
  { key: "mardi", label: "Mardi" },
  { key: "mercredi", label: "Mercredi" },
  { key: "jeudi", label: "Jeudi" },
  { key: "vendredi", label: "Vendredi" },
  { key: "samedi", label: "Samedi" },
  { key: "dimanche", label: "Dimanche" },
];

// Libelles montres au pro quand un champ empeche l'enregistrement. La cle est
// l'attribut `name` de l'input, ce qui permet de retrouver le libelle en
// parcourant form.elements sans dupliquer la liste des champs contraints.
const LIBELLES_CHAMPS: Record<string, string> = {
  name: "Nom commercial",
  founded_year: "Année de création",
  phone: "Téléphone",
  email: "Email de contact",
  website: "Site web",
  hourly_rate: "Tarif horaire indicatif",
  travel_fee: "Frais de déplacement",
};

// ============================================
// Accordéon
// ============================================

function Accordion({
  title,
  defaultOpen = false,
  open: ouvertImpose,
  onOpenChange,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  /** Mode controle. Le parent doit pouvoir DEPLIER ce bloc de force quand un
   *  champ obligatoire qu'il contient bloque l'envoi du formulaire : replie,
   *  ce champ est en display:none, donc non focusable, donc le navigateur
   *  refuse le submit SANS afficher son message (cf. revelerBloc plus bas). */
  open?: boolean;
  onOpenChange?: (ouvert: boolean) => void;
  children: React.ReactNode;
}) {
  const [ouvertInterne, setOuvertInterne] = useState(defaultOpen);
  const open = ouvertImpose ?? ouvertInterne;

  function basculer() {
    const suivant = !open;
    setOuvertInterne(suivant);
    onOpenChange?.(suivant);
  }

  return (
    <div className="border-b border-[var(--border-color)]">
      <button
        type="button"
        onClick={basculer}
        className="flex items-center justify-between w-full py-4 text-left"
      >
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </span>
        <svg
          className={`w-5 h-5 text-[var(--text-tertiary)] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>
      {/* On garde TOUJOURS les children montés, juste cachés en CSS quand
          l'accordéon est fermé. Raison : un <input> retiré du DOM (rendu
          conditionnel `{open && ...}`) n'est PAS sérialisé dans le FormData
          au submit. Tél/email/site/réseaux/tarifs vivant dans des accordéons
          fermés par défaut partaient donc « vides » → erreurs « Téléphone
          obligatoire / Email invalide » alors que les valeurs sont à l'écran.
          display:none conserve l'input (et sa valeur) dans le formulaire. */}
      <div className={open ? "pb-6 space-y-4" : "hidden"}>{children}</div>
    </div>
  );
}

// ============================================
// Toggle switch
// ============================================

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
          checked ? "bg-[var(--accent)]" : "bg-[var(--bg-tertiary)]"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      <span className="text-sm text-[var(--text-primary)]">{label}</span>
    </label>
  );
}

// ============================================
// Input field
// ============================================

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

const inputClass =
  "w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors duration-200";

const inputErrorClass =
  "w-full bg-[var(--bg-primary)] border border-red-500 rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-red-500 transition-colors duration-200";

// ============================================
// Composant principal
// ============================================

export default function FicheEditor({ categories }: Props) {
  const { pro } = useDashboard();
  // Lu depuis le contexte (déjà chargé par le layout) au lieu d'être passé en
  // prop : évitait un SELECT * complet sur `pros` juste pour ce chiffre.
  const profileCompletion = pro.profile_completion ?? 0;

  // Profile form state
  const [profileState, profileAction, profilePending] = useActionState(
    updateProProfile,
    {} as ProfileFormState
  );

  // Local state for controlled fields
  const [description, setDescription] = useState(pro.description || "");
  // Bug du dashboard 06/06 : avec defaultValue + useActionState, React peut
  // re-render le composant et perdre les valeurs DOM des inputs uncontrolled
  // (formData.get retourne null alors que la valeur est visible à l'écran).
  // Phone et email sont passés en CONTROLLED (state + value + onChange) pour
  // garantir que formData récupère bien la valeur tapée par l'user.
  const [phoneValue, setPhoneValue] = useState(pro.phone || "");
  const [emailValue, setEmailValue] = useState(pro.email || "");
  const [websiteValue, setWebsiteValue] = useState(pro.website || "");
  const [certs, setCerts] = useState<string[]>(pro.certifications || []);
  const [payments, setPayments] = useState<string[]>(pro.payment_methods || []);
  const [secondaryCats, setSecondaryCats] = useState<number[]>(
    pro.secondary_category_ids || []
  );
  const [hasRcPro, setHasRcPro] = useState(pro.has_rc_pro);
  const [hasDecennale, setHasDecennale] = useState(pro.has_decennale);
  const [freeQuote, setFreeQuote] = useState(pro.free_quote);
  const [openingHours, setOpeningHours] = useState<
    Record<string, { open: boolean; from: string; to: string }>
  >(
    (pro.opening_hours as unknown as Record<string, { open: boolean; from: string; to: string }>) ||
      DAYS.reduce(
        (acc, d) => ({
          ...acc,
          [d.key]: { open: d.key !== "dimanche", from: "09:00", to: "18:00" },
        }),
        {} as Record<string, { open: boolean; from: string; to: string }>
      )
  );

  // Upload states (appels directs, pas de forms imbriquées)
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoPending, setLogoPending] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoPending, setPhotoPending] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>(pro.photos || []);
  const [logoUrl, setLogoUrl] = useState(pro.logo_url || "");
  const [coverUrl, setCoverUrl] = useState(pro.cover_url || "");
  const [coverPending, setCoverPending] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  // Legendes des realisations, {url: legende}. C'est le seul texte de la
  // fiche que personne d'autre ne possede : mesure du 20/08/2026, deux fiches
  // voisines partagent 71,4 % de leur texte.
  const [legendes, setLegendes] = useState<Record<string, string>>(
    () => (pro.photo_captions && typeof pro.photo_captions === "object" && !Array.isArray(pro.photo_captions)
      ? { ...(pro.photo_captions as Record<string, string>) }
      : {})
  );
  const [legendeEnregistree, setLegendeEnregistree] = useState<string | null>(null);
  // Erreur PAR PHOTO : un message global serait efface par le succes de la
  // legende suivante, et le pro ne saurait pas laquelle a echoue.
  const [legendeErreurs, setLegendeErreurs] = useState<Record<string, string>>({});
  // Dernieres valeurs REELLEMENT enregistrees. Se comparer a la valeur figee
  // au chargement rendait impossible d'EFFACER une legende : on la saisissait,
  // on l'enregistrait, on la vidait, et la comparaison "vide contre vide
  // d'origine" sortait avant d'ecrire. La suppression ne partait jamais.
  const dernieresLegendes = useRef<Record<string, string>>(
    (pro.photo_captions && typeof pro.photo_captions === "object" && !Array.isArray(pro.photo_captions)
      ? { ...(pro.photo_captions as Record<string, string>) }
      : {}) as Record<string, string>
  );
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const formTopRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // BLOCAGE MUET A L'ENREGISTREMENT, corrige le 31/08/2026.
  //
  // Telephone et email portent `required`, mais ils vivent dans le bloc
  // « Contact », replie par defaut. Un accordeon replie garde ses champs
  // montes en display:none (voir le commentaire du composant Accordion : les
  // retirer du DOM les sortirait du FormData). Or la specification HTML dit
  // qu'un champ invalide « not being rendered » n'est pas focusable : le
  // navigateur interrompt l'envoi et RENONCE a afficher sa bulle. Chrome se
  // contente d'un « An invalid form control with name='phone' is not
  // focusable » en console, que personne n'ouvre. Resultat vu par le pro : il
  // clique sur Enregistrer, il ne se passe rien, aucune explication nulle
  // part. Meme piege sur le site web (type="url") qui refuse « www.monsite.fr »
  // sans etre obligatoire, et sur le nom commercial si le pro a replie le bloc
  // Identite. Sur 52 pros inscrits, en perdre un la-dessus est inacceptable.
  //
  // Les deux blocs qui contiennent des champs contraints passent donc en mode
  // controle, et `revelerBloc` les deplie au moment precis ou ils bloquent.
  const [identiteOuverte, setIdentiteOuverte] = useState(true);
  // Deplie d'emblee pour un pro dont la fiche scrapee n'a ni telephone ni
  // email : c'est exactement la population qui se fait bloquer, autant lui
  // montrer les champs manquants avant qu'il clique.
  const [contactOuvert, setContactOuvert] = useState(!pro.phone || !pro.email);
  // « Services proposes » contient tarif horaire et frais de deplacement, deux
  // champs number avec min=0 : coller « 45 € » ou « -10 » les rend invalides et
  // bloque l'envoi exactement de la meme facon, depuis un bloc lui aussi replie.
  const [servicesOuvert, setServicesOuvert] = useState(false);

  // Message de blocage cote NAVIGATEUR (la validation serveur, elle, remplit
  // profileState.error). Deplier le bloc et rendre la bulle native possible ne
  // suffit pas : cette bulle disparait au premier clic ailleurs et ne laisse
  // aucune trace. Ce message-ci reste affiche dans la barre d'enregistrement,
  // qui est collee en bas de l'ecran, donc toujours sous les yeux du pro au
  // moment ou il vient de cliquer sur Enregistrer.
  const [blocageClient, setBlocageClient] = useState<string | null>(null);

  // Empeche la boucle : reportValidity() redeclenche « invalid » sur le champ,
  // donc ce meme gestionnaire, de facon synchrone.
  const revelationEnCours = useRef(false);

  /** Deplie le bloc du champ fautif, nomme les champs a corriger, puis
   *  redemande au navigateur d'afficher sa bulle. flushSync (et pas un
   *  setTimeout) parce que reportValidity doit s'executer sur un DOM deja mis a
   *  jour : tant que le champ est cache, le navigateur reste muet, ce qui est
   *  justement le defaut corrige. */
  function revelerBloc(ouvrir: (v: boolean) => void) {
    if (revelationEnCours.current) return;
    revelationEnCours.current = true;
    flushSync(() => ouvrir(true));

    // On recompose le message a partir de TOUS les champs invalides, pas du
    // seul champ qui a emis l'evenement : telephone et email vides produisent
    // deux « invalid » distincts, et le pro doit voir les deux d'un coup.
    // `validity.valid` et surtout pas `checkValidity()`, qui reemet lui-meme un
    // evenement « invalid » et rappellerait donc cette fonction.
    const form = formRef.current;
    const fautifs = form
      ? Array.from(form.elements)
          .filter(
            (el): el is HTMLInputElement =>
              el instanceof HTMLInputElement &&
              el.willValidate &&
              !el.validity.valid
          )
          .map((el) => LIBELLES_CHAMPS[el.name] || el.name)
      : [];

    setBlocageClient(
      fautifs.length === 0
        ? null
        : fautifs.length === 1
          ? `Enregistrement impossible : le champ « ${fautifs[0]} » doit être corrigé. Il vient d'être déplié ci-dessus.`
          : `Enregistrement impossible, champs à corriger : ${fautifs.join(", ")}. Ils viennent d'être dépliés ci-dessus.`
    );

    form?.reportValidity();
    revelationEnCours.current = false;
  }

  // Meme raisonnement pour la validation SERVEUR (profileSchema dans
  // app/pro/dashboard/fiche/actions.ts revalide nom, telephone et email) : le
  // bandeau rouge annonce « corrigez : Telephone », mais le message precis et
  // le champ encadre en rouge sont dans un bloc replie. On le deplie.
  useEffect(() => {
    // L'envoi est parti : le blocage navigateur n'a plus lieu d'etre affiche,
    // sinon il resterait a l'ecran a cote de « Profil sauvegarde avec succes ».
    if (profileState.success) setBlocageClient(null);
    const champs = profileState.fieldErrors;
    if (!champs) return;
    if (champs.name || champs.description || champs.founded_year) setIdentiteOuverte(true);
    if (champs.phone || champs.email) setContactOuvert(true);
  }, [profileState]);

  // Scroll to error banner when validation fails
  const prevError = useRef(profileState.error);
  if (profileState.error && profileState.error !== prevError.current) {
    prevError.current = profileState.error;
    setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  } else if (!profileState.error) {
    prevError.current = undefined;
  }

  // Catégories secondaires disponibles : filtrées par vertical pour éviter
  // qu'un maçon voie React/Python/Kubernetes etc. (tech) dans la liste.
  // Règle : tech ↔ tech, BTP/domicile/personne (= "physique") restent ensemble
  // car un maçon peut aussi être peintre (BTP), un paysagiste peut faire de
  // l'aide aux seniors, etc. Tri alphabétique pour rendre la liste navigable.
  const PHYSICAL_VERTICALS = ["btp", "domicile", "personne"] as const;
  const primaryVertical = categories.find((c) => c.id === pro.category_id)?.vertical;
  const isPhysical = primaryVertical && (PHYSICAL_VERTICALS as readonly string[]).includes(primaryVertical);
  const MAX_SECONDARY = 10;
  const availableSecondary = categories
    .filter((c) => c.id !== pro.category_id)
    .filter((c) => {
      if (!primaryVertical) return true;
      if (isPhysical) return (PHYSICAL_VERTICALS as readonly string[]).includes(c.vertical);
      return c.vertical === primaryVertical;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

  function toggleCert(cert: string) {
    setCerts((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  }

  function togglePayment(pm: string) {
    setPayments((prev) =>
      prev.includes(pm) ? prev.filter((p) => p !== pm) : [...prev, pm]
    );
  }

  function toggleSecondaryCat(id: number) {
    setSecondaryCats((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= MAX_SECONDARY) return prev;
      return [...prev, id];
    });
  }

  function updateDayHours(day: string, field: string, value: string | boolean) {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  // Le poids est verifie AVANT l'envoi. Sans ce controle, le pro televerse,
  // attend cinq secondes, puis lit « Erreur inattendue lors de l'upload » sans
  // savoir que sa photo est trop lourde. Constate en production le 21/08/2026 :
  // le pro « Elagage precis », arrive le matin meme, a echoue deux fois de
  // suite a 10h20 et 10h21 avant de contourner seul.
  // Ces plafonds doivent rester alignes sur MAX_LOGO_SIZE et MAX_PHOTO_SIZE
  // dans app/pro/dashboard/fiche/actions.ts, et rester SOUS la limite
  // serverActions.bodySizeLimit de next.config.ts.
  const MO = 1024 * 1024;
  const trop = (file: File, plafondMo: number) =>
    file.size > plafondMo * MO
      ? `Cette image pèse ${(file.size / MO).toFixed(1)} Mo, le maximum est de ${plafondMo} Mo. Réduisez-la ou choisissez-en une autre.`
      : null;

  async function handleLogoUpload(file: File) {
    const souci = trop(file, 2);
    if (souci) { setLogoError(souci); return; }
    setLogoPending(true);
    setLogoError(null);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const result = await uploadProLogo({} as UploadState, fd);
      if (result.success && result.url) {
        setLogoUrl(result.url);
      } else {
        setLogoError(result.error || "Erreur lors de l'upload");
      }
    } catch {
      setLogoError("L'envoi a échoué. Si l'image est lourde, réduisez-la (2 Mo maximum) et réessayez.");
    } finally {
      setLogoPending(false);
    }
  }

  async function handleCoverUpload(file: File) {
    const souci = trop(file, 5);
    if (souci) { setCoverError(souci); return; }
    setCoverPending(true);
    setCoverError(null);
    try {
      const fd = new FormData();
      fd.append("couverture", file);
      const result = await uploadProCover({} as UploadState, fd);
      if (result.success && result.url) setCoverUrl(result.url);
      else setCoverError(result.error || "Erreur lors de l'envoi");
    } catch {
      setCoverError("L'envoi a échoué. Si l'image est lourde, réduisez-la (5 Mo maximum) et réessayez.");
    } finally {
      setCoverPending(false);
    }
  }

  async function handleCoverDelete() {
    setCoverPending(true);
    setCoverError(null);
    try {
      const result = await deleteProCover();
      if (result.success) setCoverUrl("");
      else setCoverError(result.error || "Erreur lors du retrait");
    } finally {
      setCoverPending(false);
    }
  }

  /** Enregistre la legende d'une photo quand le champ perd le focus. */
  async function handleLegendeBlur(url: string) {
    const valeur = (legendes[url] || "").trim();
    if (valeur === (dernieresLegendes.current[url] || "").trim()) return;
    const fd = new FormData();
    fd.append("url", url);
    fd.append("legende", valeur);
    try {
      const result = await saveProPhotoCaption({} as UploadState, fd);
      if (result.success) {
        dernieresLegendes.current[url] = valeur;
        setLegendeErreurs((prev) => {
          const suite = { ...prev };
          delete suite[url];
          return suite;
        });
        setLegendeEnregistree(url);
        window.setTimeout(() => setLegendeEnregistree((u) => (u === url ? null : u)), 2200);
      } else {
        // Un echec silencieux ferait croire au pro que sa legende est
        // enregistree alors qu'elle est perdue des qu'il quitte la page.
        setLegendeErreurs((prev) => ({ ...prev, [url]: result.error || "Légende non enregistrée. Réessayez." }));
      }
    } catch {
      // Une action serveur peut REJETER (reseau coupe, session expiree) :
      // sans ce filet, la promesse partait en erreur non rattrapee et la
      // legende disparaissait sans un mot.
      setLegendeErreurs((prev) => ({ ...prev, [url]: "Enregistrement impossible. Vérifiez votre connexion et réessayez." }));
    }
  }

  async function handlePhotoUpload(file: File) {
    const souci = trop(file, 5);
    if (souci) { setPhotoError(souci); return; }
    setPhotoPending(true);
    setPhotoError(null);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const result = await uploadProPhoto({} as UploadState, fd);
      if (result.success && result.url) {
        setPhotos((prev) => [...prev, result.url!]);
      } else {
        setPhotoError(result.error || "Erreur lors de l'upload");
      }
    } catch {
      setPhotoError("L'envoi a échoué. Si l'image est lourde, réduisez-la (5 Mo maximum) et réessayez.");
    } finally {
      setPhotoPending(false);
    }
  }

  async function handleDeletePhoto(url: string) {
    setDeletingPhoto(url);
    const result = await deleteProPhoto(url);
    if (result.success) {
      setPhotos((prev) => prev.filter((p) => p !== url));
      setLegendes((prev) => {
        const suite = { ...prev };
        delete suite[url];
        return suite;
      });
      delete dernieresLegendes.current[url];
    }
    setDeletingPhoto(null);
  }

  // Suggestions
  const suggestions: string[] = [];
  if (!pro.description) suggestions.push("Ajoutez une description pour augmenter votre visibilité");
  if (!pro.logo_url && !logoUrl) suggestions.push("Ajoutez un logo pour vous démarquer");
  if ((pro.photos || []).length === 0 && photos.length === 0) suggestions.push("Ajoutez des photos de vos réalisations");
  if (!pro.website) suggestions.push("Ajoutez votre site web");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          Ma fiche
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Éditez votre profil pour augmenter votre visibilité
        </p>
      </div>

      {/* Barre de progression */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Profil complété
          </p>
          <p className="text-sm font-bold text-[var(--accent)]">
            {profileCompletion} %
          </p>
        </div>
        <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
            style={{ width: `${profileCompletion}%` }}
          />
        </div>
        {profileCompletion >= 80 && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            Vous avez le badge &laquo; Profil complet &raquo; !
          </p>
        )}
        {profileCompletion < 80 && (
          <p className="text-xs text-[var(--text-tertiary)] mt-2">
            Complétez votre fiche pour obtenir le badge &laquo; Profil complet &raquo;
          </p>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-2xl p-4">
          <p className="text-xs font-semibold text-[var(--accent)] mb-2">
            Suggestions d&apos;amélioration
          </p>
          <ul className="space-y-1">
            {suggestions.map((s) => (
              <li
                key={s}
                className="text-sm text-[var(--text-secondary)] flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Erreur globale de validation */}
      <div ref={formTopRef}>
        {profileState.error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-red-700 dark:text-red-400">{profileState.error}</p>
          </div>
        )}
      </div>

      {/* Formulaire principal.
          `ref` est indispensable : c'est la cible de reportValidity() dans
          revelerBloc. Sans lui, deplier le bloc ne redemandait aucune bulle.
          `onInput` efface le message de blocage des que le pro corrige quoi que
          ce soit, sinon il resterait affiche apres correction et laisserait
          croire que ca bloque encore. La forme fonctionnelle evite un rendu a
          chaque frappe quand il n'y a aucun message a effacer. */}
      <form
        ref={formRef}
        action={profileAction}
        onInput={() => setBlocageClient((m) => (m ? null : m))}
      >
        {/* Hidden fields for arrays and complex data */}
        {certs.map((c) => (
          <input key={c} type="hidden" name="certifications" value={c} />
        ))}
        {payments.map((p) => (
          <input key={p} type="hidden" name="payment_methods" value={p} />
        ))}
        {secondaryCats.map((id) => (
          <input
            key={id}
            type="hidden"
            name="secondary_category_ids"
            value={id}
          />
        ))}
        <input type="hidden" name="has_rc_pro" value={String(hasRcPro)} />
        <input type="hidden" name="has_decennale" value={String(hasDecennale)} />
        <input type="hidden" name="free_quote" value={String(freeQuote)} />
        <input
          type="hidden"
          name="opening_hours"
          value={JSON.stringify(openingHours)}
        />

        <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
          {/* 1. Identité */}
          <Accordion
            title="Identité"
            open={identiteOuverte}
            onOpenChange={setIdentiteOuverte}
          >
            <Field
              label="Nom commercial"
              error={profileState.fieldErrors?.name}
            >
              <input
                name="name"
                defaultValue={pro.name}
                className={profileState.fieldErrors?.name ? inputErrorClass : inputClass}
                required
                onInvalid={() => revelerBloc(setIdentiteOuverte)}
              />
            </Field>

            <Field label="SIRET">
              <input
                value={pro.siret || "Non renseigné"}
                disabled
                className={`${inputClass} opacity-60 cursor-not-allowed`}
              />
            </Field>

            <Field
              label="Description"
              error={profileState.fieldErrors?.description}
            >
              <div className="relative">
                <textarea
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  rows={4}
                  maxLength={500}
                  placeholder="Décrivez votre activité, vos spécialités, ce qui vous distingue..."
                  className={`${inputClass} resize-none`}
                />
                <span className="absolute bottom-3 right-3 text-xs text-[var(--text-tertiary)]">
                  {description.length}/500
                </span>
              </div>
            </Field>

            <Field label="Année de création">
              <input
                name="founded_year"
                type="number"
                defaultValue={pro.founded_year || ""}
                min={1800}
                max={new Date().getFullYear()}
                placeholder="Ex : 2015"
                className={inputClass}
                onInvalid={() => revelerBloc(setIdentiteOuverte)}
              />
            </Field>
          </Accordion>

          {/* 2. Contact. Mode controle : c'est ici que vivent les deux champs
              obligatoires, et c'est ce bloc que revelerBloc doit pouvoir
              deplier de force au moment ou ils bloquent l'enregistrement. */}
          <Accordion
            title="Contact"
            open={contactOuvert}
            onOpenChange={setContactOuvert}
          >
            <Field
              label="Téléphone"
              error={profileState.fieldErrors?.phone}
            >
              <input
                name="phone"
                type="tel"
                value={phoneValue}
                onChange={(e) => setPhoneValue(e.target.value)}
                placeholder="06 12 34 56 78"
                className={profileState.fieldErrors?.phone ? inputErrorClass : inputClass}
                required
                onInvalid={() => revelerBloc(setContactOuvert)}
              />
            </Field>

            <Field
              label="Email de contact"
              error={profileState.fieldErrors?.email}
            >
              <input
                name="email"
                type="email"
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                placeholder="contact@monentreprise.fr"
                className={profileState.fieldErrors?.email ? inputErrorClass : inputClass}
                required
                onInvalid={() => revelerBloc(setContactOuvert)}
              />
            </Field>

            <Field label="Site web">
              <input
                name="website"
                type="url"
                value={websiteValue}
                onChange={(e) => setWebsiteValue(e.target.value)}
                placeholder="https://monentreprise.fr"
                className={inputClass}
                // Ce champ n'est pas obligatoire mais son type="url" refuse
                // « www.monsite.fr » (pas de schema), une saisie tres naturelle.
                // Il bloquait donc l'enregistrement du meme blocage muet que
                // telephone et email, en etant encore plus deroutant puisque le
                // pro ne le voit meme pas comme un champ requis.
                onInvalid={() => revelerBloc(setContactOuvert)}
              />
            </Field>

            <Field label="Instagram">
              <input
                name="instagram"
                defaultValue={pro.instagram || ""}
                placeholder="@monentreprise"
                className={inputClass}
              />
            </Field>

            <Field label="Facebook">
              <input
                name="facebook"
                defaultValue={pro.facebook || ""}
                placeholder="https://facebook.com/monentreprise"
                className={inputClass}
              />
            </Field>

            <Field label="LinkedIn">
              <input
                name="linkedin"
                defaultValue={pro.linkedin || ""}
                placeholder="https://linkedin.com/company/monentreprise"
                className={inputClass}
              />
            </Field>
          </Accordion>

          {/* 3. Photos (pas de <form> imbriquée, appels directs) */}
          <Accordion title="Photos">
            {/* PHOTO DE COUVERTURE (21/08/2026). Fournie par le pro, jamais
                fabriquee a partir de ses photos de chantier : sur seize
                photos reelles mesurees, treize sont en portrait, et les
                decouper en bandeau large ne garderait que 19 % de la hauteur.
                Les dimensions sont annoncees AVANT l'envoi, pas apres un
                echec : un pro a bute deux fois de suite le 21/08 sans savoir
                que le probleme etait le poids de son image. */}
            <div className="space-y-3 mb-8">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Photo de couverture
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                La grande image en haut de votre fiche. Choisissez votre plus beau chantier, en format paysage.
              </p>
              <div className="relative w-full h-28 rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-tertiary)] flex items-center justify-center">
                {coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt="Aperçu de votre photo de couverture"
                    fill
                    sizes="(max-width: 640px) 100vw, 600px"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-xs text-[var(--text-tertiary)]">
                    Aucune couverture envoyée
                  </span>
                )}
              </div>
              <dl className="text-xs text-[var(--text-secondary)] border border-[var(--border-color)] rounded-xl divide-y divide-[var(--border-color)]">
                <div className="flex justify-between gap-3 px-3 py-2">
                  <dt>Dimensions conseillées</dt>
                  <dd className="font-mono text-[var(--text-primary)]">2048 × 460 px</dd>
                </div>
                <div className="flex justify-between gap-3 px-3 py-2">
                  <dt>Proportions</dt>
                  <dd className="font-mono text-[var(--text-primary)]">4,5 : 1</dd>
                </div>
                <div className="flex justify-between gap-3 px-3 py-2">
                  <dt>Formats et poids</dt>
                  <dd className="font-mono text-[var(--text-primary)]">JPEG · PNG · WebP · 5 Mo</dd>
                </div>
              </dl>
              <p className="text-xs text-[var(--text-tertiary)] leading-relaxed border-l-2 border-[var(--border-color)] pl-3">
                Une photo prise à la verticale avec votre téléphone ne conviendra pas. Tournez l&apos;appareil, ou choisissez une vue large du chantier.
              </p>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverUpload(file);
                  e.target.value = "";
                }}
              />
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={coverPending}
                  className="text-sm font-medium text-[var(--accent)] hover:underline disabled:opacity-60"
                >
                  {coverPending ? "Envoi..." : coverUrl ? "Changer la couverture" : "Ajouter une couverture"}
                </button>
                {coverUrl && !coverPending && (
                  <button
                    type="button"
                    onClick={handleCoverDelete}
                    className="text-sm text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                  >
                    Retirer
                  </button>
                )}
              </div>
              {coverError && <p className="text-xs text-red-500">{coverError}</p>}
            </div>

            {/* Logo */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Logo
              </p>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={`Logo ${pro.name}`}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-xl object-contain border border-[var(--border-color)]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                    <span className="text-xl font-bold text-[var(--text-tertiary)]">
                      {pro.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoPending}
                    className="text-sm font-medium text-[var(--accent)] hover:underline disabled:opacity-60"
                  >
                    {logoPending ? "Upload..." : "Changer le logo"}
                  </button>
                </div>
              </div>
              {logoError && (
                <p className="text-xs text-red-500">{logoError}</p>
              )}
              <dl className="text-xs text-[var(--text-secondary)] border border-[var(--border-color)] rounded-xl divide-y divide-[var(--border-color)]">
                <div className="flex justify-between gap-3 px-3 py-2">
                  <dt>Dimensions conseillées</dt>
                  <dd className="font-mono text-[var(--text-primary)]">400 × 400 px</dd>
                </div>
                <div className="flex justify-between gap-3 px-3 py-2">
                  <dt>Proportions</dt>
                  <dd className="font-mono text-[var(--text-primary)]">carré</dd>
                </div>
                <div className="flex justify-between gap-3 px-3 py-2">
                  <dt>Formats et poids</dt>
                  <dd className="font-mono text-[var(--text-primary)]">PNG · JPEG · WebP · 2 Mo</dd>
                </div>
              </dl>
              <p className="text-xs text-[var(--text-tertiary)] leading-relaxed border-l-2 border-[var(--border-color)] pl-3">
                Votre logo est posé entier dans le cercle, jamais découpé. Un fond transparent est idéal, un fond blanc convient très bien.
              </p>
            </div>

            {/* Galerie */}
            <div className="space-y-3 mt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Galerie de réalisations
                </p>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {photos.length}/{MAX_PHOTOS}
                </span>
              </div>

              {/* Une LEGENDE par realisation (21/08/2026). C'est le seul
                  texte de la fiche que personne d'autre ne possede : mesure
                  du 20/08, deux fiches voisines partagent 71,4 % de leur
                  texte, dont 28 points ecrits par la plateforme. La legende
                  se retrouve sous la photo, dans le texte alternatif lu par
                  Google Images, et dans les donnees structurees.
                  Enregistrement a la sortie du champ : pas de bouton a
                  cliquer, donc pas de legende perdue par oubli. */}
              {photos.length > 0 && (
                <ul className="space-y-3 list-none p-0 m-0">
                  {photos.map((url) => (
                    <li
                      key={url}
                      className="flex items-start gap-3 border border-[var(--border-color)] rounded-xl p-3"
                    >
                      <div className="relative w-20 h-16 shrink-0">
                        <Image
                          src={url}
                          alt={`Réalisation ${pro.name}`}
                          fill
                          sizes="80px"
                          className="object-cover rounded-lg border border-[var(--border-color)]"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          maxLength={160}
                          value={legendes[url] ?? ""}
                          onChange={(e) => {
                            setLegendes((prev) => ({ ...prev, [url]: e.target.value }));
                            // Sinon "Légende enregistrée." reste affiche
                            // pendant que le pro retape par-dessus.
                            setLegendeEnregistree((u) => (u === url ? null : u));
                          }}
                          onBlur={() => handleLegendeBlur(url)}
                          onKeyDown={(e) => {
                            // Ce champ vit DANS le formulaire du profil :
                            // sans ce garde, la touche Entree soumettrait
                            // toute la fiche au lieu d'enregistrer la
                            // legende. On force plutot la sortie du champ,
                            // qui declenche l'enregistrement.
                            if (e.key === "Enter") {
                              e.preventDefault();
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          placeholder="Décrivez ce chantier en une phrase"
                          aria-label="Légende de cette réalisation"
                          className="w-full text-sm bg-transparent border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                        />
                        <p
                          className={`text-[11px] mt-1.5 ${
                            legendeErreurs[url]
                              ? "text-red-500"
                              : "text-[var(--text-tertiary)]"
                          }`}
                        >
                          {legendeErreurs[url]
                            ? legendeErreurs[url]
                            : legendeEnregistree === url
                              ? "Légende enregistrée."
                              : `${(legendes[url] ?? "").length}/160 caractères`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(url)}
                        disabled={deletingPhoto === url}
                        aria-label="Supprimer cette réalisation"
                        className="shrink-0 w-8 h-8 rounded-full text-[var(--text-tertiary)] hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors text-sm disabled:opacity-50"
                      >
                        &times;
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {photos.length > 0 && (
                <p className="text-xs text-[var(--text-tertiary)] leading-relaxed border-l-2 border-[var(--border-color)] pl-3">
                  Dites ce qu&apos;on voit et où : « Réfection complète d&apos;une toiture en tuiles plates, 120 m² ». Évitez « photo 1 » ou « mon travail ». C&apos;est ce texte que Google lit.
                </p>
              )}

              {photos.length < MAX_PHOTOS && (
                <div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={photoPending}
                    className="w-full border-2 border-dashed border-[var(--border-color)] rounded-2xl p-6 text-center hover:border-[var(--accent)] transition-colors duration-200"
                  >
                    <svg
                      className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {photoPending
                        ? "Upload en cours..."
                        : "Ajouter une photo"}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      JPEG, PNG ou WebP. 5 Mo maximum.
                    </p>
                  </button>
                </div>
              )}

              {photoError && (
                <p className="text-xs text-red-500">{photoError}</p>
              )}
            </div>
          </Accordion>

          {/* 4. Horaires */}
          <Accordion title="Horaires d&apos;ouverture">
            <div className="space-y-3">
              {DAYS.map((day) => {
                const h = openingHours[day.key] || {
                  open: false,
                  from: "09:00",
                  to: "18:00",
                };
                return (
                  <div
                    key={day.key}
                    className="flex items-center gap-4"
                  >
                    <div className="w-24 shrink-0">
                      <span className="text-sm text-[var(--text-primary)]">
                        {day.label}
                      </span>
                    </div>
                    <Toggle
                      checked={h.open}
                      onChange={(v) => updateDayHours(day.key, "open", v)}
                      label=""
                    />
                    {h.open && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={h.from}
                          onChange={(e) =>
                            updateDayHours(day.key, "from", e.target.value)
                          }
                          className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
                        />
                        <span className="text-sm text-[var(--text-tertiary)]">
                          à
                        </span>
                        <input
                          type="time"
                          value={h.to}
                          onChange={(e) =>
                            updateDayHours(day.key, "to", e.target.value)
                          }
                          className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
                        />
                      </div>
                    )}
                    {!h.open && (
                      <span className="text-xs text-[var(--text-tertiary)]">
                        Fermé
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Accordion>

          {/* 5. Certifications */}
          <Accordion title="Certifications et assurances">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)] mb-3">
                  Labels et certifications
                </p>
                <div className="flex flex-wrap gap-2">
                  {CERTIFICATIONS.map((cert) => (
                    <button
                      key={cert}
                      type="button"
                      onClick={() => toggleCert(cert)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        certs.includes(cert)
                          ? "bg-[var(--accent)] text-white"
                          : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
                      }`}
                    >
                      {cert}
                    </button>
                  ))}
                </div>
              </div>

              {certs.includes("RGE") && (
                <Field label="Numéro de certification RGE">
                  <input
                    name="rge_number"
                    defaultValue={pro.rge_number || ""}
                    placeholder="Ex : E-12345"
                    className={inputClass}
                  />
                </Field>
              )}

              <div className="space-y-3">
                <Toggle
                  checked={hasRcPro}
                  onChange={setHasRcPro}
                  label="Assurance responsabilité civile professionnelle"
                />
                <Toggle
                  checked={hasDecennale}
                  onChange={setHasDecennale}
                  label="Garantie décennale"
                />
              </div>
            </div>
          </Accordion>

          {/* 6. Services */}
          <Accordion
            title="Services proposés"
            open={servicesOuvert}
            onOpenChange={setServicesOuvert}
          >
            {/* Metier principal MODIFIABLE depuis le 08/08/2026.
                Il etait affiche grise, donc un pro mal classe au scraping
                n'avait AUCUN moyen de se corriger : son seul recours etait
                d'ecrire a l'equipe. Cas reel : Aicha SANGARE, classee « Garde
                animaux » alors qu'elle fait de l'accompagnement sante, a
                ecrit deux fois puis demande la suppression de sa fiche.
                Sur 2,4 M de fiches issues d'un scraping (dont 1 233 038
                ouvertes au 03/09/2026) ou les codes NAF sont
                ambigus (cf. les lecons du 18/04), le mauvais metier est
                frequent : c'est donc un blocage systemique, pas un cas isole.
                Le backend acceptait deja `category_id` : il ne manquait que ce
                menu. */}
            <Field label="Métier principal">
              <select
                name="category_id"
                defaultValue={pro.category_id}
                className={inputClass}
              >
                {categories
                  .filter((c) => !primaryVertical || c.vertical === primaryVertical)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
                C&apos;est ce métier qui détermine les projets que vous recevez.
                Si aucun ne correspond vraiment au vôtre, écrivez-nous à
                contact@workwave.fr.
              </p>
            </Field>

            <div>
              <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                Catégories secondaires{" "}
                <span className="text-xs text-[var(--text-tertiary)]">
                  (max {MAX_SECONDARY} · {secondaryCats.length}/{MAX_SECONDARY} sélectionnée{secondaryCats.length > 1 ? "s" : ""})
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {availableSecondary.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleSecondaryCat(cat.id)}
                    disabled={
                      !secondaryCats.includes(cat.id) &&
                      secondaryCats.length >= MAX_SECONDARY
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      secondaryCats.includes(cat.id)
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Tarif horaire indicatif (€)">
                <input
                  name="hourly_rate"
                  type="number"
                  min={0}
                  step={0.5}
                  defaultValue={pro.hourly_rate || ""}
                  placeholder="Ex : 45"
                  className={inputClass}
                  onInvalid={() => revelerBloc(setServicesOuvert)}
                />
              </Field>

              <Field label="Frais de déplacement (€)">
                <input
                  name="travel_fee"
                  type="number"
                  min={0}
                  step={0.5}
                  defaultValue={pro.travel_fee || ""}
                  placeholder="Ex : 30"
                  className={inputClass}
                  onInvalid={() => revelerBloc(setServicesOuvert)}
                />
              </Field>
            </div>

            <Toggle
              checked={freeQuote}
              onChange={setFreeQuote}
              label="Devis gratuit"
            />
          </Accordion>

          {/* 7. Modes de paiement */}
          <Accordion title="Modes de paiement acceptés">
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => togglePayment(pm.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    payments.includes(pm.value)
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </Accordion>
        </div>

        {/* Messages d'état + Bouton sauvegarder */}
        <div className="sticky bottom-20 lg:bottom-4 z-10 mt-6">
          <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-4 flex items-center justify-between gap-4 shadow-lg">
            <div className="min-w-0">
              {/* Le blocage cote navigateur passe AVANT les messages du
                  serveur : c'est le seul cas ou rien n'est parti, donc le seul
                  ou le pro n'a aucune autre explication a l'ecran. Les messages
                  serveur, eux, s'affichent deja en haut de page. */}
              {blocageClient ? (
                <p className="text-sm text-red-500">{blocageClient}</p>
              ) : profileState.success ? (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Profil sauvegardé avec succès
                </p>
              ) : profileState.error ? (
                <p className="text-sm text-red-500">{profileState.error}</p>
              ) : (
                <a
                  href={`/artisan/${pro.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--accent)] hover:underline"
                >
                  Prévisualiser ma fiche publique
                </a>
              )}
            </div>
            <button
              type="submit"
              disabled={profilePending}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
            >
              {profilePending ? "Sauvegarde..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const MAX_PHOTOS = 10;
