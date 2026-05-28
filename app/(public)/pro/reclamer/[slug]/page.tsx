import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ClaimForm from "@/components/pro/ClaimForm";
import { BASE_URL } from "@/lib/constants";
import { createClient } from "@supabase/supabase-js";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getProForClaim(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // On charge un peu plus de champs (adresse, ville, date de creation Sirene)
  // pour pouvoir afficher au pro "Nous avons ces infos sur votre entreprise"
  // = pattern endowment Yelp/Google qui declenche la perception "je
  // recupere ce qui existe deja, je ne cree pas une fiche from scratch".
  const { data, error } = await supabase
    .from("pros")
    .select(
      "id, name, slug, siret, address, postal_code, email, phone, claimed_by_user_id, created_at, category:categories(name), city:cities(name)"
    )
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data;
}

// Format SIRET en groupes de 3-3-3-5 chiffres pour la lisibilite humaine.
function formatSiret(siret: string | null): string {
  if (!siret) return "";
  const clean = siret.replace(/\s+/g, "");
  if (clean.length !== 14) return clean;
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9)}`;
}

// Helper pour normaliser city/category Supabase : selon le typage genere
// (single-row vs multi-row), Supabase renvoie soit { name } soit [{ name }].
// On normalise en string | null.
function pickName(
  v: { name?: string | null } | { name?: string | null }[] | null | undefined
): string | null {
  if (!v) return null;
  if (Array.isArray(v)) return v[0]?.name ?? null;
  return v.name ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pro = await getProForClaim(slug);
  if (!pro) return {};

  return {
    title: `Réclamer la fiche ${pro.name} — Workwave`,
    description: `Vous êtes le gérant de ${pro.name} ? Réclamez votre fiche professionnelle sur Workwave pour gérer votre profil et recevoir des demandes de clients.`,
    robots: { index: false, follow: false },
    alternates: {
      canonical: `${BASE_URL}/pro/reclamer/${slug}`,
    },
  };
}

export default async function ClaimPage({ params }: Props) {
  const { slug } = await params;
  const pro = await getProForClaim(slug);

  if (!pro) notFound();

  // Fiche déjà réclamée
  if (pro.claimed_by_user_id) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--accent-muted)] flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
          Fiche déjà réclamée
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          La fiche <span className="font-medium text-[var(--text-primary)]">{pro.name}</span> a déjà été réclamée par son propriétaire.
          Si vous pensez qu&apos;il y a une erreur, contactez le support.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:contact@workwave.fr"
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02]"
          >
            Contacter le support
          </a>
          <Link
            href={`/artisan/${slug}`}
            className="border border-[var(--border-color)] text-[var(--text-primary)] px-6 py-3 rounded-full text-sm font-semibold transition-all duration-250 hover:bg-[var(--bg-secondary)]"
          >
            Retour à la fiche
          </Link>
        </div>
      </main>
    );
  }

  // Fiche sans SIRET
  if (!pro.siret) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
          Réclamation manuelle requise
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          La fiche <span className="font-medium text-[var(--text-primary)]">{pro.name}</span> ne peut pas être réclamée automatiquement.
          Contactez le support pour une vérification manuelle.
        </p>
        <a
          href="mailto:contact@workwave.fr"
          className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02]"
        >
          Contacter contact@workwave.fr
        </a>
      </main>
    );
  }

  // Donnees publiques deja connues pour pre-affichage (effet endowment).
  const cityName = pickName(pro.city);
  const categoryName = pickName(pro.category);
  const sirenisationDate = pro.created_at
    ? new Date(pro.created_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      {/* Retour */}
      <Link
        href={`/artisan/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors duration-250 mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Retour à la fiche
      </Link>

      {/* Banner ROUGE : alerte si email ou telephone manquant. Boost
          conversion car le pro voit immediatement qu'il manque "le minimum
          pour etre joignable" → motivation forte de finaliser le claim. */}
      {(!pro.email || !pro.phone) && (
        <section className="bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-800 rounded-2xl p-5 sm:p-6 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
                Action requise
              </p>
              <h2 className="text-base sm:text-lg font-bold text-red-700 dark:text-red-300 leading-snug mb-1">
                Il manque les informations de contact pour que les clients
                puissent vous joindre
              </h2>
              <p className="text-sm text-red-600 dark:text-red-400/90 leading-relaxed">
                {!pro.email && !pro.phone
                  ? "Votre email et votre téléphone sont absents."
                  : !pro.email
                    ? "Votre email professionnel est absent."
                    : "Votre téléphone est absent."}{" "}
                Réclamez votre fiche maintenant (gratuit, 2 min) pour les ajouter
                et commencer à recevoir des leads.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Bloc "Nous avons ces infos sur votre entreprise" — affichage des
          donnees Sirene deja connues. Pattern Yelp/Google : le pro voit qu'il
          recupere ce qui existe deja (effet endowment), ne cree pas une fiche
          from scratch. Difference psy = +30-50% de conversion selon CRO 2026. */}
      <section className="bg-[#FF5A36]/5 dark:bg-[#FF5A36]/8 border border-[#FF5A36]/20 dark:border-[#FF5A36]/30 rounded-2xl p-5 sm:p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#FF5A36] flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-[#FF5A36] uppercase tracking-wider mb-1">
              Votre fiche existe déjà
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] leading-snug">
              Nous avons ces informations sur votre entreprise
            </h2>
          </div>
        </div>

        <dl className="space-y-2.5 mb-4 ml-11">
          <div className="flex flex-col sm:flex-row sm:gap-3">
            <dt className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide sm:w-32 shrink-0 sm:pt-0.5">
              Nom commercial
            </dt>
            <dd className="text-sm text-[var(--text-primary)] font-semibold">
              {pro.name}
            </dd>
          </div>

          {pro.siret && (
            <div className="flex flex-col sm:flex-row sm:gap-3">
              <dt className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide sm:w-32 shrink-0 sm:pt-0.5">
                SIRET
              </dt>
              <dd className="text-sm text-[var(--text-primary)] font-mono">
                {formatSiret(pro.siret)}
              </dd>
            </div>
          )}

          {(pro.address || cityName || pro.postal_code) && (
            <div className="flex flex-col sm:flex-row sm:gap-3">
              <dt className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide sm:w-32 shrink-0 sm:pt-0.5">
                Adresse
              </dt>
              <dd className="text-sm text-[var(--text-primary)]">
                {pro.address && <>{pro.address}<br /></>}
                {pro.postal_code} {cityName}
              </dd>
            </div>
          )}

          {categoryName && (
            <div className="flex flex-col sm:flex-row sm:gap-3">
              <dt className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide sm:w-32 shrink-0 sm:pt-0.5">
                Activité
              </dt>
              <dd className="text-sm text-[var(--text-primary)]">
                {categoryName}
              </dd>
            </div>
          )}

          {sirenisationDate && (
            <div className="flex flex-col sm:flex-row sm:gap-3">
              <dt className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide sm:w-32 shrink-0 sm:pt-0.5">
                Référencée le
              </dt>
              <dd className="text-sm text-[var(--text-primary)]">
                {sirenisationDate}
              </dd>
            </div>
          )}

          {/* Email : si present = noir normal, si absent = rouge avec mention
              "vos clients ne peuvent pas vous joindre". Boost conversion. */}
          <div className="flex flex-col sm:flex-row sm:gap-3">
            <dt className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide sm:w-32 shrink-0 sm:pt-0.5">
              Email
            </dt>
            <dd
              className={
                pro.email
                  ? "text-sm text-[var(--text-primary)]"
                  : "text-sm font-semibold text-red-600 dark:text-red-400"
              }
            >
              {pro.email || "Non renseigné — vos clients ne peuvent pas vous joindre"}
            </dd>
          </div>

          {/* Telephone : meme logique */}
          <div className="flex flex-col sm:flex-row sm:gap-3">
            <dt className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide sm:w-32 shrink-0 sm:pt-0.5">
              Téléphone
            </dt>
            <dd
              className={
                pro.phone
                  ? "text-sm text-[var(--text-primary)]"
                  : "text-sm font-semibold text-red-600 dark:text-red-400"
              }
            >
              {pro.phone || "Non renseigné — vos clients ne peuvent pas vous joindre"}
            </dd>
          </div>
        </dl>

        <p className="text-xs text-[var(--text-tertiary)] ml-11">
          Données issues du registre <strong>Sirene</strong> (INSEE) et de Workwave. Confirmez votre identité ci-dessous pour prendre le contrôle de cette fiche.
        </p>
      </section>

      {/* Bandeau d'accroche commercial : transforme l'aspect "formulaire admin"
          en opportunite. Le ton est positif (felicitations) + benefit-oriented
          (recevoir des demandes de devis). */}
      <div className="bg-gradient-to-br from-[#FF5A36]/5 via-[#FF5A36]/10 to-transparent dark:from-[#FF5A36]/8 dark:via-[#FF5A36]/12 border border-[#FF5A36]/20 dark:border-[#FF5A36]/30 rounded-2xl p-5 sm:p-6 mb-4">
        <p className="text-base sm:text-lg text-[var(--text-primary)] leading-relaxed">
          <span className="font-bold">Félicitations,</span> votre entreprise est déjà en ligne sur Workwave&nbsp;!
          Prenez le contrôle pour <span className="font-semibold">personnaliser votre présentation</span> et
          commencer à <span className="font-semibold text-[#FF5A36]">recevoir des demandes de devis</span>.
        </p>
      </div>

      {/* Indicateur de progression : reduit la friction perçue ("c'est presque fini"). */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="flex-1 h-1.5 bg-[#FF5A36] rounded-full" />
        <div className="flex-1 h-1.5 bg-[var(--border-color)] rounded-full" />
      </div>
      <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3 px-1">
        Étape 1 / 2 — Vérification d&apos;identité
      </p>

      {/* Card formulaire : ombre portee + bordure plus marquee pour la faire
          "ressortir" de la page (hierarchie visuelle = etape logique). */}
      <div className="bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-2xl p-6 sm:p-8 shadow-lg shadow-[#FF5A36]/5 dark:shadow-black/30">
        <ClaimForm slug={slug} proName={pro.name} />
      </div>
    </main>
  );
}
