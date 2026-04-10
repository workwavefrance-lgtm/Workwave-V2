"use client";

import { useState, useActionState, useRef } from "react";
import { useDashboard } from "@/components/pro/dashboard/DashboardProvider";
import {
  updateProProfile,
  uploadProLogo,
  uploadProPhoto,
  deleteProPhoto,
  type ProfileFormState,
  type UploadState,
} from "@/app/pro/dashboard/fiche/actions";
import type { Category, Certification, PaymentMethod, OpeningHours } from "@/lib/types/database";

type Props = {
  categories: Category[];
  profileCompletion: number;
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

// ============================================
// Accordéon
// ============================================

function Accordion({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--border-color)]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
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
      {open && <div className="pb-6 space-y-4">{children}</div>}
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

// ============================================
// Composant principal
// ============================================

export default function FicheEditor({ categories, profileCompletion }: Props) {
  const { pro } = useDashboard();

  // Profile form state
  const [profileState, profileAction, profilePending] = useActionState(
    updateProProfile,
    {} as ProfileFormState
  );

  // Local state for controlled fields
  const [description, setDescription] = useState(pro.description || "");
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

  // Upload states
  const [logoState, logoAction, logoPending] = useActionState(
    uploadProLogo,
    {} as UploadState
  );
  const [photoState, photoAction, photoPending] = useActionState(
    uploadProPhoto,
    {} as UploadState
  );
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>(pro.photos || []);
  const [logoUrl, setLogoUrl] = useState(pro.logo_url || "");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Available secondary categories (exclude primary)
  const availableSecondary = categories.filter(
    (c) => c.id !== pro.category_id
  );

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
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  function updateDayHours(day: string, field: string, value: string | boolean) {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  async function handleDeletePhoto(url: string) {
    setDeletingPhoto(url);
    const result = await deleteProPhoto(url);
    if (result.success) {
      setPhotos((prev) => prev.filter((p) => p !== url));
    }
    setDeletingPhoto(null);
  }

  // Handle logo upload result
  if (logoState.success && logoState.url && logoState.url !== logoUrl) {
    setLogoUrl(logoState.url);
  }

  // Handle photo upload result
  if (photoState.success && photoState.url && !photos.includes(photoState.url)) {
    setPhotos((prev) => [...prev, photoState.url!]);
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

      {/* Formulaire principal */}
      <form action={profileAction}>
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
          <Accordion title="Identité" defaultOpen>
            <Field
              label="Nom commercial"
              error={profileState.fieldErrors?.name}
            >
              <input
                name="name"
                defaultValue={pro.name}
                className={inputClass}
                required
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
              />
            </Field>
          </Accordion>

          {/* 2. Contact */}
          <Accordion title="Contact">
            <Field
              label="Téléphone"
              error={profileState.fieldErrors?.phone}
            >
              <input
                name="phone"
                type="tel"
                defaultValue={pro.phone || ""}
                placeholder="06 12 34 56 78"
                className={inputClass}
                required
              />
            </Field>

            <Field
              label="Email de contact"
              error={profileState.fieldErrors?.email}
            >
              <input
                name="email"
                type="email"
                defaultValue={pro.email || ""}
                placeholder="contact@monentreprise.fr"
                className={inputClass}
                required
              />
            </Field>

            <Field label="Site web">
              <input
                name="website"
                type="url"
                defaultValue={pro.website || ""}
                placeholder="https://monentreprise.fr"
                className={inputClass}
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

          {/* 3. Photos */}
          <Accordion title="Photos">
            {/* Logo */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Logo
              </p>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-16 h-16 rounded-xl object-cover border border-[var(--border-color)]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                    <span className="text-xl font-bold text-[var(--text-tertiary)]">
                      {pro.name.charAt(0)}
                    </span>
                  </div>
                )}
                <form action={logoAction}>
                  <input
                    ref={logoInputRef}
                    type="file"
                    name="logo"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={() => logoInputRef.current?.form?.requestSubmit()}
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoPending}
                    className="text-sm font-medium text-[var(--accent)] hover:underline disabled:opacity-60"
                  >
                    {logoPending ? "Upload..." : "Changer le logo"}
                  </button>
                </form>
              </div>
              {logoState.error && (
                <p className="text-xs text-red-500">{logoState.error}</p>
              )}
              <p className="text-xs text-[var(--text-tertiary)]">
                JPEG, PNG ou WebP. 2 Mo maximum.
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

              {photos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {photos.map((url) => (
                    <div key={url} className="relative group aspect-square">
                      <img
                        src={url}
                        alt="Réalisation"
                        className="w-full h-full object-cover rounded-xl border border-[var(--border-color)]"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(url)}
                        disabled={deletingPhoto === url}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length < MAX_PHOTOS && (
                <form action={photoAction}>
                  <input
                    ref={photoInputRef}
                    type="file"
                    name="photo"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={() =>
                      photoInputRef.current?.form?.requestSubmit()
                    }
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
                </form>
              )}

              {photoState.error && (
                <p className="text-xs text-red-500">{photoState.error}</p>
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
          <Accordion title="Services proposés">
            <Field label="Catégorie principale">
              <input
                value={pro.category.name}
                disabled
                className={`${inputClass} opacity-60 cursor-not-allowed`}
              />
            </Field>

            <div>
              <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                Catégories secondaires{" "}
                <span className="text-xs text-[var(--text-tertiary)]">
                  (max 3)
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
                      secondaryCats.length >= 3
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
              {profileState.success && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Profil sauvegardé avec succès
                </p>
              )}
              {profileState.error && (
                <p className="text-sm text-red-500">{profileState.error}</p>
              )}
              {!profileState.success && !profileState.error && (
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
