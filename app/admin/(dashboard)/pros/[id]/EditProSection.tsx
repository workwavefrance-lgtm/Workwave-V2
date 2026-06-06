"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProByAdmin } from "./actions";

type Category = { id: number; name: string; vertical: string };

type EditableProValues = {
  category_id: number | null;
  secondary_category_ids: number[];
  description: string;
  phone: string;
  email: string;
  website: string;
};

/**
 * Section ÉDITION admin pour la fiche pro. Apparaît dans ProDetailClient
 * juste après l'en-tête. Compactée par défaut, dépliable au clic.
 *
 * Couleurs : on n'utilise PAS les CSS vars du site public (--bg-primary etc.)
 * car elles ne sont pas définies dans l'admin → texte noir sur fond noir.
 * À la place : tailwind explicite (bg-white, text-zinc-900, etc.), thème
 * lisible en light ET dark mode.
 */
export default function EditProSection({
  proId,
  initial,
  categories,
}: {
  proId: number;
  initial: EditableProValues;
  categories: Category[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [categoryId, setCategoryId] = useState<number | null>(initial.category_id);
  const [secondaryIds, setSecondaryIds] = useState<number[]>(initial.secondary_category_ids || []);
  const [description, setDescription] = useState(initial.description || "");
  const [phone, setPhone] = useState(initial.phone || "");
  const [email, setEmail] = useState(initial.email || "");
  const [website, setWebsite] = useState(initial.website || "");

  const byVertical = categories.reduce<Record<string, Category[]>>((acc, c) => {
    (acc[c.vertical] = acc[c.vertical] || []).push(c);
    return acc;
  }, {});
  const verticalLabels: Record<string, string> = {
    btp: "BTP & Artisanat",
    domicile: "Services à domicile",
    personne: "Aide à la personne",
    tech: "Tech / AI",
  };

  function toggleSecondary(catId: number) {
    setSecondaryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId],
    );
  }

  function onSubmit() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await updateProByAdmin({
        proId,
        categoryId: categoryId ?? undefined,
        secondaryCategoryIds: secondaryIds,
        description,
        phone,
        email,
        website,
      });
      if (!res.ok) {
        setError(res.error || "Erreur inconnue");
        return;
      }
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  // Classes input réutilisables : blanc + bordure grise, texte noir, sur tous thèmes
  const inputCls =
    "w-full rounded-lg border border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5A36] focus:border-[#FF5A36]";

  if (!open) {
    return (
      <div className="mt-6 mb-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border-2 border-[#FF5A36] text-[#FF5A36] hover:bg-[#FF5A36] hover:text-white px-5 py-2 text-sm font-semibold transition-colors"
        >
          ✏️ Éditer la fiche
        </button>
      </div>
    );
  }

  return (
    <section className="mt-6 mb-6 rounded-2xl border border-[#FF5A36]/40 bg-orange-50 p-6 text-zinc-900">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-zinc-900">
          ✏️ Édition admin de la fiche
        </h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-zinc-600 hover:text-zinc-900"
        >
          Annuler
        </button>
      </div>

      {/* Catégorie principale */}
      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2 text-zinc-900">
          Catégorie principale
        </label>
        <select
          value={categoryId ?? ""}
          onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : null)}
          className={inputCls}
        >
          <option value="">— Aucune —</option>
          {Object.entries(byVertical).map(([vertical, cats]) => (
            <optgroup key={vertical} label={verticalLabels[vertical] || vertical}>
              {cats
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Catégories secondaires (multi-pick) */}
      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2 text-zinc-900">
          Catégories secondaires{" "}
          <span className="font-normal text-zinc-600">
            (cochez pour ajouter / décochez pour retirer)
          </span>
        </label>
        <div className="max-h-64 overflow-y-auto rounded-lg border border-zinc-300 bg-white p-3 space-y-3">
          {Object.entries(byVertical).map(([vertical, cats]) => (
            <div key={vertical}>
              <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-500 mb-1.5">
                {verticalLabels[vertical] || vertical}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {cats
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .filter((c) => c.id !== categoryId)
                  .map((c) => {
                    const active = secondaryIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleSecondary(c.id)}
                        className={
                          active
                            ? "rounded-full bg-[#FF5A36] text-white px-3 py-1 text-xs font-semibold"
                            : "rounded-full border border-zinc-300 bg-white text-zinc-900 hover:border-[#FF5A36] hover:text-[#FF5A36] px-3 py-1 text-xs"
                        }
                      >
                        {active ? "✓ " : "+ "}
                        {c.name}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
        {secondaryIds.length > 0 && (
          <p className="mt-2 text-xs text-zinc-600">
            {secondaryIds.length} catégorie{secondaryIds.length > 1 ? "s" : ""} secondaire
            {secondaryIds.length > 1 ? "s" : ""}.
          </p>
        )}
      </div>

      {/* Description */}
      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2 text-zinc-900">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={1000}
          className={inputCls + " resize-y"}
          placeholder="Présentation de l'entreprise…"
        />
        <p className="mt-1 text-xs text-zinc-600">
          {description.length} / 1000 caractères
        </p>
      </div>

      {/* Coordonnées */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-zinc-900">Téléphone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputCls}
            placeholder="+33…"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-zinc-900">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder="…@…"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-zinc-900">Site web</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className={inputCls}
            placeholder="https://…"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={pending}
          className="rounded-full bg-[#FF5A36] hover:bg-[#E63E1A] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 text-sm font-semibold transition-colors"
        >
          {pending ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
        {success && (
          <span className="text-sm text-green-700 font-semibold">✓ Enregistré</span>
        )}
        {error && <span className="text-sm text-red-700 font-semibold">{error}</span>}
      </div>
    </section>
  );
}
