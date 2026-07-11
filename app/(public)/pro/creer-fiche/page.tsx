import type { Metadata } from "next";
import Link from "next/link";
import { getAllCategories } from "@/lib/queries/categories";
import { fetchCompanyBySiret } from "@/lib/utils/recherche-entreprises";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";
import CreerFicheForm from "./CreerFicheForm";

export const metadata: Metadata = {
  title: "Créer ma fiche pro gratuitement — Workwave",
  description:
    "Créez gratuitement votre fiche professionnelle sur Workwave à partir de votre SIRET. Sans abonnement, sans commission. Recevez les demandes de particuliers dans votre zone.",
};

export default async function CreerFichePage({
  searchParams,
}: {
  searchParams: Promise<{ siret?: string; pays?: string }>;
}) {
  const sp = await searchParams;
  const siretRaw = (sp.siret || "").replace(/\D/g, "").slice(0, 14);
  // Pré-sélection du pays : ?pays=be (liens belges) ou numéro BCE 10 chiffres.
  const initialCountry: "FR" | "BE" =
    sp.pays === "be" || siretRaw.length === 10 ? "BE" : "FR";

  // Pré-remplissage depuis le registre officiel français (best-effort).
  // Pas d'équivalent automatisé pour la Belgique (le webservice BCE est
  // payant ; le scraping du site Public Search est interdit par ses CGU).
  const company =
    siretRaw.length === 14 ? await fetchCompanyBySiret(siretRaw) : null;

  // Métiers BTP / services (on exclut les catégories tech/AI).
  const allCats = await getAllCategories();
  const categories = allCats
    .filter((c) => !(AI_CATEGORY_IDS as readonly number[]).includes(c.id))
    .map((c) => ({ id: c.id, name: c.name }));

  const prefill = company
    ? {
        name: company.name,
        address: company.address,
        postalCode: company.postalCode,
        commune: company.commune,
        naf: company.naf,
        foundingDate: company.foundingDate,
      }
    : null;

  return (
    <main className="min-h-screen bg-[var(--bg-secondary)] py-12 sm:py-16 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
            Créez votre fiche
          </h1>
          <p className="mt-3 text-[var(--text-secondary)] leading-relaxed">
            Gratuite, sans abonnement, sans commission. Artisans de France et
            de Belgique : renseignez votre numéro d&apos;entreprise (SIRET ou
            BCE) et recevez les demandes de particuliers dans votre zone.
          </p>
        </div>

        <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl p-6 sm:p-8 shadow-sm">
          <CreerFicheForm
            categories={categories}
            prefill={prefill}
            siret={siretRaw}
            initialCountry={initialCountry}
          />
        </div>

        <p className="text-center mt-6 text-sm text-[var(--text-tertiary)]">
          Déjà une fiche ?{" "}
          <Link href="/pro/retrouver-fiche" className="text-[var(--accent)] hover:underline">
            Retrouvez-la avec votre SIRET
          </Link>
        </p>
      </div>
    </main>
  );
}
