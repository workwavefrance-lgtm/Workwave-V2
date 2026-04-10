"use client";

import { useState, useActionState } from "react";
import { useDashboard } from "@/components/pro/dashboard/DashboardProvider";
import {
  updatePreferences,
  type PreferencesFormState,
} from "@/app/pro/dashboard/preferences/actions";
import CountUp from "@/components/ui/CountUp";
import type { Category } from "@/lib/types/database";

type Props = {
  categories: Category[];
  previewCount: number;
};

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

export default function PreferencesEditor({
  categories,
  previewCount,
}: Props) {
  const { pro } = useDashboard();

  const [state, formAction, pending] = useActionState(
    updatePreferences,
    {} as PreferencesFormState
  );

  const [radius, setRadius] = useState(pro.intervention_radius_km);
  const [enabledCats, setEnabledCats] = useState<number[]>(
    pro.enabled_category_ids || [pro.category_id]
  );
  const [urgencyAvailable, setUrgencyAvailable] = useState(
    pro.urgency_available
  );
  const [paused, setPaused] = useState(
    !!pro.paused_until && new Date(pro.paused_until) > new Date()
  );
  const [pausedDate, setPausedDate] = useState(
    pro.paused_until
      ? new Date(pro.paused_until).toISOString().split("T")[0]
      : ""
  );

  // Catégories disponibles : principale + secondaires
  const allProCatIds = [
    pro.category_id,
    ...(pro.secondary_category_ids || []),
  ];
  const availableCats = categories.filter((c) => allProCatIds.includes(c.id));

  function toggleCategory(id: number) {
    // La catégorie principale ne peut pas être désactivée
    if (id === pro.category_id) return;
    setEnabledCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  // Tomorrow for min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          Préférences leads
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Configurez comment vous recevez les demandes de clients
        </p>
      </div>

      <form action={formAction} className="space-y-6">
        {/* Hidden fields */}
        <input
          type="hidden"
          name="urgency_available"
          value={String(urgencyAvailable)}
        />
        {enabledCats.map((id) => (
          <input
            key={id}
            type="hidden"
            name="enabled_category_ids"
            value={id}
          />
        ))}
        {!paused && <input type="hidden" name="paused_until" value="" />}

        {/* Rayon d'intervention */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
            Rayon d&apos;intervention
          </h2>
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-4xl font-bold text-[var(--text-primary)]">
                {radius}
              </span>
              <span className="text-lg text-[var(--text-secondary)] ml-1">
                km
              </span>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                autour de{" "}
                {pro.city?.name || "votre adresse"}
              </p>
            </div>
            <input
              type="range"
              name="intervention_radius_km"
              min={5}
              max={100}
              step={5}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
            />
            <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
              <span>5 km</span>
              <span>100 km</span>
            </div>
          </div>
          {state.fieldErrors?.intervention_radius_km && (
            <p className="text-xs text-red-500 mt-2">
              {state.fieldErrors.intervention_radius_km}
            </p>
          )}
        </div>

        {/* Catégories activées */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
            Catégories activées
          </h2>
          <p className="text-xs text-[var(--text-tertiary)] mb-3">
            Choisissez pour quelles catégories vous souhaitez recevoir des leads
          </p>
          <div className="flex flex-wrap gap-2">
            {availableCats.map((cat) => {
              const isActive = enabledCats.includes(cat.id);
              const isPrimary = cat.id === pro.category_id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  disabled={isPrimary}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
                  } ${isPrimary ? "cursor-not-allowed opacity-80" : ""}`}
                >
                  {cat.name}
                  {isPrimary && (
                    <span className="ml-1 text-xs opacity-70">
                      (principale)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {availableCats.length <= 1 && (
            <p className="text-xs text-[var(--text-tertiary)] mt-3">
              Ajoutez des catégories secondaires dans &laquo; Ma fiche &raquo; pour avoir
              plus d&apos;options ici.
            </p>
          )}
        </div>

        {/* Budget minimum + Urgences */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              Budget minimum accepté
            </h2>
            <div className="relative max-w-xs">
              <input
                name="min_budget"
                type="number"
                min={0}
                step={50}
                defaultValue={pro.min_budget || ""}
                placeholder="Aucun minimum"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 pr-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors duration-200"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-tertiary)]">
                &euro;
              </span>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-2">
              Les projets avec un budget inférieur ne vous seront pas envoyés
            </p>
          </div>

          <div className="pt-4 border-t border-[var(--border-color)]">
            <Toggle
              checked={urgencyAvailable}
              onChange={setUrgencyAvailable}
              label="Disponible pour les urgences"
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-2 ml-14">
              Vous recevrez les demandes marquées comme urgentes en priorité
            </p>
          </div>
        </div>

        {/* Pause leads */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Mettre en pause mes leads
          </h2>
          <Toggle
            checked={paused}
            onChange={(v) => {
              setPaused(v);
              if (!v) setPausedDate("");
            }}
            label="Suspendre la réception de leads"
          />
          {paused && (
            <div className="mt-4 ml-14">
              <label className="block text-sm text-[var(--text-secondary)] mb-2">
                Date de reprise automatique
              </label>
              <input
                name="paused_until"
                type="date"
                value={pausedDate}
                min={minDate}
                onChange={(e) => setPausedDate(e.target.value)}
                required
                className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors duration-200"
              />
              {pausedDate && (
                <p className="text-xs text-[var(--accent)] mt-2">
                  Vos leads seront mis en pause jusqu&apos;au{" "}
                  {new Date(pausedDate).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          )}
          {state.fieldErrors?.paused_until && (
            <p className="text-xs text-red-500 mt-2">
              {state.fieldErrors.paused_until}
            </p>
          )}
        </div>

        {/* Aperçu dynamique */}
        <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-2xl p-6 text-center">
          <p className="text-sm text-[var(--text-secondary)] mb-2">
            Avec vos réglages actuels, vous auriez reçu
          </p>
          <p className="text-4xl font-bold text-[var(--accent)]">
            <CountUp end={previewCount} duration={1200} />
          </p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {previewCount === 1 ? "lead le mois dernier" : "leads le mois dernier"}
          </p>
        </div>

        {/* Messages + Bouton */}
        <div className="flex items-center justify-between gap-4">
          <div>
            {state.success && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Préférences sauvegardées
              </p>
            )}
            {state.error && (
              <p className="text-sm text-red-500">{state.error}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={pending}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pending ? "Sauvegarde..." : "Enregistrer mes préférences"}
          </button>
        </div>
      </form>
    </div>
  );
}
