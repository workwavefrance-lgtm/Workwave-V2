"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { verifierArtisan, type EtatVerification } from "./actions";
import type { ResultatVerification } from "@/lib/verifier-artisan/construire-resultat";

const initial: EtatVerification = { statut: "vide" };

/** Saisie : chiffres seulement, groupés par 3 (puis 5 pour la fin du SIRET). */
function formaterSaisie(valeur: string): string {
  const d = valeur.replace(/\D/g, "").slice(0, 14);
  const groupes = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9), d.slice(9)];
  return groupes.filter(Boolean).join(" ");
}

function IconeCoche({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}

function IconeCroix({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}

function IconePoint({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="3.5" />
    </svg>
  );
}

type Ton = "ok" | "alerte" | "neutre";

const PASTILLE: Record<Ton, string> = {
  ok: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  alerte: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
  neutre: "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)]",
};

function Pastille({ ton, children }: { ton: Ton; children: React.ReactNode }) {
  const Icone = ton === "ok" ? IconeCoche : ton === "alerte" ? IconeCroix : IconePoint;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${PASTILLE[ton]}`}>
      <Icone className="w-4 h-4 shrink-0" />
      {children}
    </span>
  );
}

function Ligne({ terme, children }: { terme: string; children: React.ReactNode }) {
  return (
    <div className="py-3.5 border-t border-[var(--border-color)] first:border-t-0 sm:grid sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-sm text-[var(--text-secondary)] mb-1 sm:mb-0">{terme}</dt>
      <dd className="text-[15px] text-[var(--text-primary)] leading-relaxed">{children}</dd>
    </div>
  );
}

function tonEtablissement(r: ResultatVerification): Ton {
  if (r.etablissement.code === "ouvert") return "ok";
  if (r.etablissement.code === "ferme") return "alerte";
  return "neutre";
}

function tonEntreprise(r: ResultatVerification): Ton {
  if (r.entreprise.code === "active") return "ok";
  if (r.entreprise.code === "cessee") return "alerte";
  return "neutre";
}

function CarteResultat({ etat }: { etat: Extract<EtatVerification, { statut: "ok" }> }) {
  const { resultat: r, fiche, metier } = etat;
  const ferme = r.etablissement.code === "ferme";
  const cessee = r.entreprise.code === "cessee";

  const hrefProjet = metier ? `/deposer-projet?categorie=${metier.slug}` : "/deposer-projet";
  const libelleMetier = metier ? `${metier.article} ${metier.nom.toLowerCase()}` : "un artisan";

  return (
    <section
      aria-live="polite"
      className="mt-8 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm overflow-hidden"
    >
      <div className="p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)] mb-2">
          {r.numeroSaisi.type === "siren" ? "Siège de l'entreprise" : r.estSiege ? "Établissement (siège)" : "Établissement secondaire"}
          {" · "}
          <span className="font-mono normal-case tracking-normal">SIRET {r.siretAffichage}</span>
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
          {r.nom}
        </h2>
        {r.nomCommercial && (
          <p className="mt-1 text-[var(--text-secondary)]">Nom commercial : {r.nomCommercial}</p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <Pastille ton={tonEtablissement(r)}>{r.etablissement.libelle}</Pastille>
          <Pastille ton={tonEntreprise(r)}>{r.entreprise.libelle}</Pastille>
        </div>

        {ferme && !cessee && (
          <p className="mt-4 text-sm text-[var(--text-secondary)] leading-relaxed">
            Ce lieu d&apos;activité est fermé au registre, mais l&apos;entreprise existe encore
            {typeof r.etablissementsOuverts === "number" && r.etablissementsOuverts > 0
              ? ` : ${r.etablissementsOuverts} établissement${r.etablissementsOuverts > 1 ? "s" : ""} encore ouvert${r.etablissementsOuverts > 1 ? "s" : ""}.`
              : "."}
            {r.siegeEnActivite && (
              <>
                {" "}Son siège en activité porte le SIRET{" "}
                <span className="font-mono">{r.siegeEnActivite.siretAffichage}</span>
                {r.siegeEnActivite.adresse ? ` (${r.siegeEnActivite.adresse}).` : "."}
              </>
            )}
          </p>
        )}
        {cessee && (
          <p className="mt-4 text-sm text-[var(--text-secondary)] leading-relaxed">
            L&apos;entreprise a cessé toute activité d&apos;après le registre. Un devis ou une facture
            à ce numéro ne peut plus engager une société existante.
          </p>
        )}
      </div>

      <dl className="px-6 sm:px-8 pb-2 border-t border-[var(--border-color)]">
        <Ligne terme="Activité">
          {r.activite ? (
            <>
              {r.activite.libelle || "Libellé inconnu"}{" "}
              <span className="font-mono text-sm text-[var(--text-tertiary)]">({r.activite.code})</span>
            </>
          ) : (
            "Non renseignée au registre"
          )}
        </Ligne>
        <Ligne terme="Adresse">{r.adresse || "Non renseignée au registre"}</Ligne>
        <Ligne terme="Création">
          {r.creation ? (
            <>
              {r.creation.texte}
              {r.creation.anciennete && (
                <span className="text-[var(--text-secondary)]"> · {r.creation.anciennete} d&apos;ancienneté</span>
              )}
            </>
          ) : (
            "Non renseignée au registre"
          )}
        </Ligne>
        <Ligne terme="Forme juridique">
          {r.formeJuridique
            ? r.formeJuridique.libelle || `Code ${r.formeJuridique.code}`
            : "Non renseignée au registre"}
        </Ligne>
        <Ligne terme="Effectif salarié">
          {r.effectif ? (
            <>
              {r.effectif.libelle}
              {r.effectif.annee && (
                <span className="text-[var(--text-secondary)]"> (donnée {r.effectif.annee})</span>
              )}
            </>
          ) : (
            "Non renseigné au registre"
          )}
        </Ligne>
        <Ligne terme="Certification RGE">
          {r.rge.certifie
            ? `Entreprise reconnue RGE${r.rge.qualifications > 0 ? ` (${r.rge.qualifications} qualification${r.rge.qualifications > 1 ? "s" : ""} enregistrée${r.rge.qualifications > 1 ? "s" : ""} pour cet établissement)` : ""}`
            : "Aucune mention RGE au registre"}
        </Ligne>
        <Ligne terme="SIREN">
          <span className="font-mono">{r.siren.slice(0, 3)} {r.siren.slice(3, 6)} {r.siren.slice(6)}</span>
        </Ligne>
      </dl>

      <div className="px-6 sm:px-8 py-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-tertiary)]">
        {/* Chaîne construite en une fois : le compilateur JSX avale l'espace
            entre une expression et un retour à la ligne (leçon du 02/09). */}
        {`Source : registre Sirene (INSEE), consulté le ${r.consulteLe} via l'API Annuaire des entreprises.`}
      </div>

      <div className="px-6 sm:px-8 py-6 border-t border-[var(--border-color)] space-y-4">
        {fiche && (
          <p className="text-[15px]">
            <Link
              href={fiche.href}
              className="font-medium text-[var(--text-primary)] underline underline-offset-4 decoration-[var(--border-hover)] hover:decoration-[var(--text-primary)] transition-colors duration-200"
            >
              Voir sa fiche sur Workwave.fr
            </Link>
          </p>
        )}
        <div className="rounded-xl border border-[var(--border-color)] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="font-semibold text-[var(--text-primary)]">
              Vous cherchez {libelleMetier} ?
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {ferme || cessee
                ? "Décrivez votre projet, gratuitement : des professionnels en activité près de chez vous vous répondent."
                : "Décrivez votre projet gratuitement pour comparer plusieurs devis."}
            </p>
          </div>
          <Link
            href={hrefProjet}
            className="mt-4 sm:mt-0 inline-flex items-center justify-center whitespace-nowrap h-11 px-5 rounded-full border border-[var(--text-primary)] text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all duration-200 hover:scale-[1.02]"
          >
            Décrivez votre projet
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function VerifierArtisanForm() {
  const [etat, action, enCours] = useActionState(verifierArtisan, initial);
  const [saisie, setSaisie] = useState("");

  return (
    <>
      <form
        action={action}
        className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm p-5 sm:p-6"
      >
        {/* Pot de miel : hors écran, ignoré par les lecteurs d'écran. */}
        <input
          type="text"
          name="site_web_hp"
          tabIndex={-1}
          autoComplete="off"
          className="absolute left-[-9999px] w-0 h-0"
          aria-hidden="true"
        />
        <label htmlFor="numero" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          SIRET (14 chiffres) ou SIREN (9 chiffres)
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="numero"
            name="numero"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="123 456 789 00012"
            maxLength={17}
            value={saisie}
            onChange={(e) => setSaisie(formaterSaisie(e.target.value))}
            className="flex-1 h-14 px-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-lg font-mono tracking-wide text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all duration-200 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            required
          />
          <button
            type="submit"
            disabled={enCours}
            className="h-14 px-8 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {enCours ? "Vérification…" : "Vérifier"}
          </button>
        </div>
        <p className="mt-3 text-xs text-[var(--text-tertiary)]">
          Le numéro figure sur le devis ou la facture. Gratuit, sans inscription, aucune donnée conservée.
        </p>
      </form>

      {etat.statut === "erreur" && !enCours && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-4"
        >
          <p className="text-sm text-red-700 dark:text-red-400">{etat.message}</p>
        </div>
      )}

      {etat.statut === "ok" && <CarteResultat etat={etat} />}
    </>
  );
}
