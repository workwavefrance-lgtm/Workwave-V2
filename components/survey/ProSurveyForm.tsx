"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const METIERS = [
  "Plombier", "Électricien", "Maçon", "Menuisier", "Peintre",
  "Chauffagiste", "Carreleur", "Multi-services", "Autre",
];
const TAILLES = ["Seul", "À 2-5", "À 6 et plus"];
const TACHES = [
  "Faire les devis",
  "Faire les factures",
  "Relancer les clients / devis non signés",
  "Répondre aux appels et messages",
  "Trouver de nouveaux clients",
  "La compta / les charges / l'administratif",
  "Gérer le planning et les RDV",
  "Gérer les avis et la visibilité en ligne",
  "Autre",
];
const HEURES = ["Moins de 2h", "2 à 5h", "5 à 10h", "Plus de 10h"];
const OUTILS = ["Rien / de tête", "Papier", "Excel", "Un logiciel payant", "Je délègue"];

const inputBase =
  "w-full h-12 px-4 rounded-xl border bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all duration-200 outline-none";
const labelCls = "block text-base font-semibold text-[var(--text-primary)] mb-2.5";
const selectCls = inputBase + " appearance-none cursor-pointer pr-10";

export default function ProSurveyForm({ source = "enquete-pro" }: { source?: string }) {
  const [metier, setMetier] = useState("");
  const [taille, setTaille] = useState("");
  const [departement, setDepartement] = useState("");
  const [taches, setTaches] = useState<string[]>([]);
  const [heures, setHeures] = useState("");
  const [corvee, setCorvee] = useState("");
  const [outils, setOutils] = useState("");
  const [outilsDetail, setOutilsDetail] = useState("");
  const [outilsEssayes, setOutilsEssayes] = useState("");
  const [prenom, setPrenom] = useState("");
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function toggleTache(t: string) {
    setTaches((prev) => {
      if (prev.includes(t)) return prev.filter((x) => x !== t);
      if (prev.length >= 2) return prev; // max 2
      return [...prev, t];
    });
  }

  const valid = metier !== "" && taches.length >= 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!valid) {
      setError("Indiquez au moins votre métier et 1 tâche chronophage.");
      return;
    }
    setSubmitting(true);
    const sb = createClient();
    const { error: insErr } = await sb.from("pro_survey_responses").insert({
      metier,
      taille: taille || null,
      departement: departement.trim() || null,
      taches_chrono: taches,
      heures_admin: heures || null,
      corvee_libre: corvee.trim() || null,
      outils_actuels: outils || null,
      outils_detail: outilsDetail.trim() || null,
      outils_essayes: outilsEssayes.trim() || null,
      prenom: prenom.trim() || null,
      contact: contact.trim() || null,
      consent,
      source,
    });
    setSubmitting(false);
    if (insErr) {
      setError("Une erreur est survenue. Réessayez dans un instant.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Merci, c&apos;est noté&nbsp;!</h2>
        <p className="text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
          Vos réponses sont lues par l&apos;équipe et orientent vraiment ce qu&apos;on construit.
          {consent && contact.trim() ? " On vous recontacte pour vous montrer la suite en avant-première." : ""}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Métier — obligatoire */}
      <div>
        <label htmlFor="metier" className={labelCls}>Votre métier&nbsp;?</label>
        <div className="relative">
          <select id="metier" value={metier} onChange={(e) => setMetier(e.target.value)} required className={selectCls}>
            <option value="" disabled>Choisir…</option>
            {METIERS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <Chevron />
        </div>
      </div>

      {/* Taille */}
      <div>
        <label htmlFor="taille" className={labelCls}>Vous travaillez…</label>
        <div className="relative">
          <select id="taille" value={taille} onChange={(e) => setTaille(e.target.value)} className={selectCls}>
            <option value="">Choisir…</option>
            {TAILLES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <Chevron />
        </div>
      </div>

      {/* Département */}
      <div>
        <label htmlFor="departement" className={labelCls}>Votre département&nbsp;?</label>
        <input id="departement" type="text" value={departement} onChange={(e) => setDepartement(e.target.value)}
          placeholder="Ex : 86 (optionnel)" maxLength={60} className={inputBase} />
      </div>

      {/* Tâches chronophages — obligatoire, max 2 */}
      <div>
        <label className={labelCls}>
          Dans une semaine type, qu&apos;est-ce qui vous prend le plus de temps EN DEHORS du chantier&nbsp;?
        </label>
        <p className="text-sm text-[var(--text-tertiary)] mb-3">Choisissez-en 2 max.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {TACHES.map((t) => {
            const active = taches.includes(t);
            const disabled = !active && taches.length >= 2;
            return (
              <button
                type="button"
                key={t}
                onClick={() => toggleTache(t)}
                disabled={disabled}
                aria-pressed={active}
                className={`text-left px-4 py-3 rounded-xl border text-[15px] leading-snug transition-all duration-200 ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-primary)] font-medium"
                    : disabled
                    ? "border-[var(--border-color)] text-[var(--text-tertiary)] opacity-50 cursor-not-allowed"
                    : "border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent)]/50"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${active ? "bg-[var(--accent)] border-[var(--accent)]" : "border-[var(--border-color)]"}`}>
                    {active && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </span>
                  {t}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Heures admin */}
      <div>
        <label htmlFor="heures" className={labelCls}>
          Environ combien d&apos;heures par semaine sur tout cet administratif, hors chantier&nbsp;?
        </label>
        <div className="relative">
          <select id="heures" value={heures} onChange={(e) => setHeures(e.target.value)} className={selectCls}>
            <option value="">Choisir…</option>
            {HEURES.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
          <Chevron />
        </div>
      </div>

      {/* Corvée libre */}
      <div>
        <label htmlFor="corvee" className={labelCls}>
          Si vous pouviez supprimer UNE seule corvée de votre semaine d&apos;un coup, ce serait laquelle&nbsp;?
        </label>
        <textarea id="corvee" value={corvee} onChange={(e) => setCorvee(e.target.value)} rows={3} maxLength={500}
          placeholder="Dites-le avec vos mots…" className={inputBase + " h-auto py-3 resize-none"} />
      </div>

      {/* Outils actuels */}
      <div>
        <label htmlFor="outils" className={labelCls}>Aujourd&apos;hui, vous gérez ça avec quoi&nbsp;?</label>
        <div className="relative">
          <select id="outils" value={outils} onChange={(e) => setOutils(e.target.value)} className={selectCls}>
            <option value="">Choisir…</option>
            {OUTILS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <Chevron />
        </div>
        <input type="text" value={outilsDetail} onChange={(e) => setOutilsDetail(e.target.value)}
          placeholder="Lequel ? (optionnel)" maxLength={120} className={inputBase + " mt-2.5"} />
      </div>

      {/* Outils essayés */}
      <div>
        <label htmlFor="outilsEssayes" className={labelCls}>
          Vous avez déjà essayé ou payé un outil pour ça&nbsp;? Si oui lequel, et pourquoi vous l&apos;avez gardé ou lâché&nbsp;?
        </label>
        <textarea id="outilsEssayes" value={outilsEssayes} onChange={(e) => setOutilsEssayes(e.target.value)} rows={3} maxLength={500}
          placeholder="Optionnel" className={inputBase + " h-auto py-3 resize-none"} />
      </div>

      {/* Bloc contact */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 space-y-4">
        <p className="text-base font-semibold text-[var(--text-primary)]">
          Laissez votre prénom + un email ou téléphone si vous acceptez qu&apos;on vous recontacte et qu&apos;on vous montre ce qu&apos;on construit en avant-première.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom" maxLength={60} className={inputBase} />
          <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Email ou téléphone" maxLength={120} className={inputBase} />
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent)]" />
          <span className="text-sm text-[var(--text-secondary)] leading-relaxed">J&apos;accepte d&apos;être recontacté à propos de ces outils.</span>
        </label>
        <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
          Données utilisées uniquement pour ce contact, pas de revente, suppression sur simple demande.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3.5">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button type="submit" disabled={submitting || !valid}
        className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-4 rounded-full text-base font-bold transition-all duration-200 hover:scale-[1.01] disabled:hover:scale-100 flex items-center justify-center gap-2">
        {submitting ? "Envoi…" : "Envoyer mes réponses"}
      </button>
      <p className="text-center text-xs text-[var(--text-tertiary)]">2 minutes · vos réponses comptent</p>
    </form>
  );
}

function Chevron() {
  return (
    <svg className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]"
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
