import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAiProByUserId } from "@/lib/queries/pros";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";
import {
  PERSONA_COLORS,
  COLOR_HEX,
  COLOR_HEX_DARKER,
  COLOR_LABEL,
  getInitials,
  normalizeColor,
  type PersonaColor,
} from "@/lib/ai/personalisation";
import { updateAiProfile, uploadAiAvatar, deleteAiAvatar } from "./actions";
import SubmitButton from "@/components/ai/SubmitButton";

export const metadata: Metadata = {
  title: "Mon profil — Dashboard Workwave AI",
  description: "Editez votre profil freelance Workwave AI.",
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  name_required: "Le nom complet est obligatoire.",
  avatar_no_file: "Aucun fichier selectionne.",
  avatar_invalid_type: "Format accepte : JPEG, PNG ou WebP.",
  avatar_too_large: "Photo trop lourde (max 2 Mo).",
  avatar_upload_failed: "Erreur d'upload. Reessayez.",
};

export default async function AiDashboardProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const saved = sp.saved === "1";
  const errorKey = sp.error;
  const errorMsg = errorKey ? ERROR_MESSAGES[errorKey] || "Erreur. Reessayez." : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const pro = await getAiProByUserId(user.id);
  if (!pro || !AI_CATEGORY_IDS.includes(pro.category_id)) return null;

  return (
    <div className="max-w-3xl">
      {saved && (
        <div
          className="mb-6 p-4 rounded-lg border border-green-500/20 bg-green-500/10 text-green-800"
          role="status"
        >
          <p className="text-sm font-medium">✓ Modifications enregistrees.</p>
        </div>
      )}
      {errorMsg && (
        <div
          className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-800"
          role="alert"
        >
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      <div className="mb-10">
        <p
          className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          [ DASHBOARD · MON PROFIL ]
        </p>
        <h1
          className="font-black text-[var(--ai-text)] uppercase mb-3"
          style={{
            fontSize: "clamp(28px, 4.5vw, 48px)",
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
          }}
        >
          Mon profil.
        </h1>
        <p className="text-base text-[var(--ai-text-secondary)]">
          Ces informations sont utilisees par notre IA pour vous matcher avec les meilleurs projets.
        </p>
      </div>

      {/* Avatar photo upload — FORM SEPARE (multipart/form-data) */}
      <div className="mb-8" id="avatar">
        <p
          className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-1"
          style={{
            letterSpacing: "0.18em",
            fontFamily: "var(--font-geist-mono), monospace",
          }}
        >
          Photo de profil
        </p>
        <p className="text-[12px] text-[var(--ai-text-tertiary)] mb-4">
          Une photo claire et professionnelle augmente la confiance des clients
          (max 2 Mo, JPEG / PNG / WebP).
        </p>
        <div className="flex items-center gap-5 flex-wrap">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-[24px] shrink-0 overflow-hidden bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)]"
            aria-hidden="true"
          >
            {pro.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pro.logo_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span
                style={{
                  background: `linear-gradient(135deg, ${COLOR_HEX[normalizeColor(pro.avatar_color)]} 0%, ${COLOR_HEX_DARKER[normalizeColor(pro.avatar_color)]} 100%)`,
                  color: "white",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {getInitials(pro.name || "Freelance")}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 flex-1 min-w-[200px]">
            <form action={uploadAiAvatar} encType="multipart/form-data" className="flex flex-wrap gap-2 items-center">
              <input
                type="file"
                name="avatar"
                accept="image/jpeg,image/png,image/webp"
                required
                className="text-[12px] text-[var(--ai-text-secondary)] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[13px] file:font-semibold file:bg-[var(--ai-text)] file:text-white hover:file:bg-[#1F1F1F] file:cursor-pointer cursor-pointer"
              />
              <SubmitButton
                pendingText="Upload en cours..."
                className="inline-flex items-center justify-center h-10 px-4 text-[13px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Uploader
              </SubmitButton>
            </form>

            {pro.logo_url && (
              <form action={deleteAiAvatar}>
                <SubmitButton
                  pendingText="Suppression..."
                  className="inline-flex items-center justify-center h-9 px-3 text-[12px] font-semibold rounded-lg bg-transparent border border-[var(--ai-border-subtle)] hover:border-red-400 hover:text-red-600 text-[var(--ai-text-secondary)] transition-colors disabled:opacity-60"
                >
                  Supprimer la photo
                </SubmitButton>
              </form>
            )}
          </div>
        </div>
      </div>

      <form action={updateAiProfile} className="space-y-6">
        <Field label="Nom complet" name="name" defaultValue={pro.name || ""} required />

        <FieldArea
          label="Bio courte"
          name="description"
          defaultValue={pro.description || ""}
          rows={4}
          maxLength={500}
          hint="Decrivez votre expertise en 2-3 phrases (500 caracteres max)."
        />

        <Field
          label="Skills / Stack"
          name="skills"
          defaultValue={pro.skills || ""}
          hint="React, Node.js, AWS, etc. — separer par des virgules."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field
            label="GitHub (handle)"
            name="github_username"
            defaultValue={pro.github_username || ""}
            prefix="github.com/"
          />
          <Field
            label="LinkedIn (URL)"
            name="linkedin"
            defaultValue={pro.linkedin || ""}
            type="url"
            placeholder="https://linkedin.com/in/..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field
            label="Annees d'experience"
            name="years_experience"
            type="number"
            min={0}
            max={50}
            defaultValue={pro.years_experience?.toString() || ""}
          />
          <Field
            label="TJM indicatif (€/jour)"
            name="hourly_rate"
            type="number"
            min={50}
            max={5000}
            defaultValue={pro.hourly_rate?.toString() || ""}
            hint="Indicatif, modifiable a tout moment."
          />
        </div>

        {/* ───────── Personnalisation Phase 12 (cool/fun) ───────── */}
        <PersonalisationSection
          name={pro.name || "Freelance"}
          avatarColor={normalizeColor(pro.avatar_color)}
          themeColor={normalizeColor(pro.theme_color)}
        />

        <button
          type="submit"
          className="inline-flex items-center justify-center h-12 px-7 text-[14px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
        >
          Enregistrer les modifications
        </button>
      </form>
    </div>
  );
}

/**
 * Section personnalisation Phase 12 : avatar_color + theme_color.
 * 2 grilles de 8 couleurs, click pour selectionner via radio (preview live).
 */
function PersonalisationSection({
  name,
  avatarColor,
  themeColor,
}: {
  name: string;
  avatarColor: PersonaColor;
  themeColor: PersonaColor;
}) {
  const initials = getInitials(name);
  return (
    <div className="pt-6 border-t border-[var(--ai-border-subtle)]">
      <p
        className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-1"
        style={{
          letterSpacing: "0.18em",
          fontFamily: "var(--font-geist-mono), monospace",
        }}
      >
        Personnalisation
      </p>
      <p className="text-[12px] text-[var(--ai-text-tertiary)] mb-6">
        Choisissez vos couleurs : avatar (cercle d&apos;initiales) et accent (fiche publique).
      </p>

      {/* Avatar color selector */}
      <fieldset className="mb-6">
        <div className="flex items-center gap-4 mb-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-[18px] shrink-0 transition-all"
            style={{
              background: `linear-gradient(135deg, ${COLOR_HEX[avatarColor]} 0%, ${COLOR_HEX_DARKER[avatarColor]} 100%)`,
              color: "white",
            }}
            aria-hidden="true"
          >
            {initials}
          </div>
          <legend className="block text-[13px] font-semibold text-[var(--ai-text)]">
            Couleur de l&apos;avatar
          </legend>
        </div>
        <div className="grid grid-cols-8 gap-2 max-w-md">
          {PERSONA_COLORS.map((c) => (
            <ColorOption
              key={c}
              name="avatar_color"
              value={c}
              defaultChecked={avatarColor === c}
              label={COLOR_LABEL[c]}
            />
          ))}
        </div>
      </fieldset>

      {/* Theme color selector */}
      <fieldset>
        <div className="flex items-center gap-4 mb-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all"
            style={{
              background: COLOR_HEX[themeColor],
              boxShadow: `0 8px 24px -8px ${COLOR_HEX[themeColor]}80`,
            }}
            aria-hidden="true"
          >
            <span className="text-white font-bold text-[18px]">✦</span>
          </div>
          <legend className="block text-[13px] font-semibold text-[var(--ai-text)]">
            Couleur d&apos;accent (fiche publique)
          </legend>
        </div>
        <div className="grid grid-cols-8 gap-2 max-w-md">
          {PERSONA_COLORS.map((c) => (
            <ColorOption
              key={c}
              name="theme_color"
              value={c}
              defaultChecked={themeColor === c}
              label={COLOR_LABEL[c]}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}

/**
 * Pastille de couleur cliquable (radio). Affiche un check si selected.
 */
function ColorOption({
  name,
  value,
  defaultChecked,
  label,
}: {
  name: string;
  value: PersonaColor;
  defaultChecked: boolean;
  label: string;
}) {
  return (
    <label
      className="relative block cursor-pointer aspect-square"
      title={label}
    >
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span
        className="block w-full h-full rounded-full border-2 border-transparent peer-checked:border-[var(--ai-text)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ai-accent-subtle)] transition-all hover:scale-110"
        style={{ background: COLOR_HEX[value] }}
      />
      <span className="sr-only">{label}</span>
    </label>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  hint,
  placeholder,
  prefix,
  min,
  max,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  prefix?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
        style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
      >
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-[var(--ai-text-tertiary)]">
            {prefix}
          </span>
        )}
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          min={min}
          max={max}
          className={`w-full h-12 px-4 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all ${
            prefix ? "pl-[110px]" : ""
          }`}
        />
      </div>
      {hint && (
        <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-1.5 leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
}

function FieldArea({
  label,
  name,
  defaultValue,
  rows,
  maxLength,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  maxLength?: number;
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
        style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
      >
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        maxLength={maxLength}
        className="w-full px-4 py-3 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all resize-none"
      />
      {hint && (
        <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-1.5">{hint}</p>
      )}
    </div>
  );
}
