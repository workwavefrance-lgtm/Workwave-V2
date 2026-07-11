"use client";

import { useActionState, useState } from "react";
import { createFiche, type CreateFicheState } from "./actions";

type Cat = { id: number; name: string };
export type Prefill = {
  name?: string | null;
  address?: string | null;
  postalCode?: string | null;
  commune?: string | null;
  naf?: string | null;
  foundingDate?: string | null;
} | null;

const initial: CreateFicheState = { success: false };

function formatSiret(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
}

// Numéro d'entreprise belge (BCE) : 10 chiffres, affiché 1016.514.072.
function formatBceInput(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0, 4)}.${d.slice(4)}`;
  return `${d.slice(0, 4)}.${d.slice(4, 7)}.${d.slice(7)}`;
}

const INPUT =
  "w-full h-12 px-4 rounded-xl border bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-200 outline-none border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20";
const LABEL = "block text-sm font-medium text-[var(--text-primary)] mb-2";

// Drapeaux en SVG inline (jamais d'emoji : rendu cassé sur Windows).
function FlagFR({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="10" height="20" fill="#0055A4" />
      <rect x="10" width="10" height="20" fill="#FFFFFF" />
      <rect x="20" width="10" height="20" fill="#EF4135" />
    </svg>
  );
}
function FlagBE({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="10" height="20" fill="#1A1A1A" />
      <rect x="10" width="10" height="20" fill="#FFD90C" />
      <rect x="20" width="10" height="20" fill="#F31830" />
    </svg>
  );
}

export default function CreerFicheForm({
  categories,
  prefill,
  siret,
  initialCountry = "FR",
}: {
  categories: Cat[];
  prefill: Prefill;
  siret: string;
  initialCountry?: "FR" | "BE";
}) {
  const [state, formAction, isPending] = useActionState(createFiche, initial);
  const [country, setCountry] = useState<"FR" | "BE">(initialCountry);
  const [siretVal, setSiretVal] = useState(
    initialCountry === "BE" ? formatBceInput(siret) : formatSiret(siret)
  );

  const isBE = country === "BE";

  function switchCountry(c: "FR" | "BE") {
    if (c === country) return;
    setCountry(c);
    // Reformater la saisie du numéro selon le pays (les longueurs diffèrent).
    setSiretVal((v) => (c === "BE" ? formatBceInput(v) : formatSiret(v)));
  }

  const countryBtn = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-2.5 h-14 rounded-xl border-2 text-sm font-semibold transition-all duration-200 cursor-pointer ${
      active
        ? "border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--text-primary)]"
        : "border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]"
    }`;

  return (
    <form action={formAction} className="space-y-5">
      {/* Honeypot */}
      <input
        type="text"
        name="website_hp"
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] w-0 h-0"
        aria-hidden="true"
      />
      {/* Méta pré-remplies depuis l'API (transmises à l'action).
          CP + commune sont des champs VISIBLES obligatoires plus bas : quand le
          lookup SIRET échoue (typo, entreprise récente, non-diffusible), les
          hidden partaient vides → fiche sans city_id, invisible des listings
          et jamais matchée par le broadcast (cas renov-toit-00013, 12/06). */}
      <input type="hidden" name="naf" defaultValue={prefill?.naf || ""} />
      <input type="hidden" name="founding_date" defaultValue={prefill?.foundingDate || ""} />
      {/* Pays de l'entreprise : pilote la validation côté serveur. */}
      <input type="hidden" name="country" value={country} />

      {/* Sélecteur de pays — drapeaux explicites pour ne perdre personne. */}
      <div>
        <span className={LABEL}>Où est enregistrée votre entreprise ?</span>
        <div className="flex gap-3" role="radiogroup" aria-label="Pays de l'entreprise">
          <button
            type="button"
            role="radio"
            aria-checked={!isBE}
            onClick={() => switchCountry("FR")}
            className={countryBtn(!isBE)}
          >
            <FlagFR className="w-7 h-[18px] rounded-[3px] shadow-sm shrink-0" />
            France
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={isBE}
            onClick={() => switchCountry("BE")}
            className={countryBtn(isBE)}
          >
            <FlagBE className="w-7 h-[18px] rounded-[3px] shadow-sm shrink-0" />
            Belgique
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--text-tertiary)]">
          {isBE
            ? "Entreprise belge : identifiez-vous avec votre numéro d'entreprise (BCE), 10 chiffres — celui de votre inscription à la Banque-Carrefour des Entreprises."
            : "Entreprise française : identifiez-vous avec votre numéro SIRET, 14 chiffres — celui de votre inscription au registre INSEE."}
        </p>
      </div>

      {state.message && !state.success && !isPending && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
        </div>
      )}

      {prefill?.name && !isBE && (
        <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-3 text-sm text-[var(--text-secondary)]">
          ✓ Infos pré-remplies depuis le registre officiel (INSEE). Vérifiez et complétez.
        </div>
      )}

      <div>
        <label htmlFor="siret" className={LABEL}>
          {isBE ? "Numéro d'entreprise (BCE)" : "Numéro SIRET"}
        </label>
        <input
          id="siret"
          name="siret"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={isBE ? "1016.514.072" : "123 456 789 01234"}
          maxLength={isBE ? 12 : 17}
          value={siretVal}
          onChange={(e) =>
            setSiretVal(isBE ? formatBceInput(e.target.value) : formatSiret(e.target.value))
          }
          className={`${INPUT} font-mono tracking-wide`}
          required
        />
        {isBE && (
          <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
            Vous le trouvez sur vos factures (numéro de TVA sans le « BE ») ou sur{" "}
            <a
              href="https://kbopub.economie.fgov.be/kbopub/zoeknaamfonetischform.html?lang=fr"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[var(--accent)]"
            >
              BCE Public Search
            </a>
            .
          </p>
        )}
      </div>

      <div>
        <label htmlFor="name" className={LABEL}>Nom de l&apos;entreprise</label>
        <input id="name" name="name" type="text" maxLength={150} defaultValue={prefill?.name || ""} placeholder={isBE ? "Ex : N.C.O Design" : "Ex : SARL Dupont Rénovation"} className={INPUT} required />
      </div>

      <div>
        <label htmlFor="category_id" className={LABEL}>Votre métier</label>
        <select id="category_id" name="category_id" defaultValue="" className={INPUT} required>
          <option value="" disabled>Choisissez votre métier…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className={LABEL}>Email professionnel</label>
          <input id="email" name="email" type="email" maxLength={200} autoComplete="email" placeholder={isBE ? "votre.email@exemple.be" : "votre.email@exemple.fr"} className={INPUT} required />
        </div>
        <div>
          <label htmlFor="phone" className={LABEL}>Téléphone</label>
          <input id="phone" name="phone" type="tel" maxLength={30} autoComplete="tel" placeholder={isBE ? "0470 12 34 56" : "06 12 34 56 78"} className={INPUT} required />
        </div>
      </div>

      <div>
        <label htmlFor="address" className={LABEL}>
          Adresse <span className="text-[var(--text-tertiary)] font-normal">(optionnel)</span>
        </label>
        <input id="address" name="address" type="text" maxLength={300} defaultValue={prefill?.address || ""} className={INPUT} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="postal_code" className={LABEL}>Code postal</label>
          <input
            id="postal_code"
            name="postal_code"
            type="text"
            inputMode="numeric"
            pattern={isBE ? "\\d{4}" : "\\d{5}"}
            maxLength={isBE ? 4 : 5}
            autoComplete="postal-code"
            placeholder={isBE ? "1080" : "56670"}
            defaultValue={prefill?.postalCode || ""}
            className={INPUT}
            required
          />
        </div>
        <div>
          <label htmlFor="commune" className={LABEL}>Commune</label>
          <input
            id="commune"
            name="commune"
            type="text"
            maxLength={120}
            autoComplete="address-level2"
            placeholder={isBE ? "Ex : Molenbeek-Saint-Jean" : "Ex : Riantec"}
            defaultValue={prefill?.commune || ""}
            className={INPUT}
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100"
      >
        {isPending ? "Création…" : "Créer ma fiche gratuitement"}
      </button>

      <p className="text-xs text-[var(--text-tertiary)] text-center">
        Étape suivante : vous confirmez par un code envoyé à votre email pour activer votre fiche. Gratuit, sans engagement.
      </p>
    </form>
  );
}
