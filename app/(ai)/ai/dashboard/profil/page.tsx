import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getProByUserId } from "@/lib/queries/pros";
import { updateAiProfile } from "./actions";

export const metadata: Metadata = {
  title: "Mon profil — Dashboard Workwave AI",
  description: "Editez votre profil freelance Workwave AI.",
  robots: { index: false, follow: false },
};

const AI_CATEGORY_IDS = [43, 44, 45, 46, 47, 48];

export default async function AiDashboardProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const pro = await getProByUserId(user.id);
  if (!pro || !AI_CATEGORY_IDS.includes(pro.category_id)) return null;

  return (
    <div className="max-w-3xl">
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
