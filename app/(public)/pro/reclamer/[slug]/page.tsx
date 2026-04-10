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

  const { data, error } = await supabase
    .from("pros")
    .select("id, name, slug, siret, claimed_by_user_id, category:categories(name)")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data;
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

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      {/* Retour */}
      <Link
        href={`/artisan/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors duration-250 mb-8"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Retour à la fiche
      </Link>

      {/* Card formulaire */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-8">
        <ClaimForm slug={slug} proName={pro.name} />
      </div>
    </main>
  );
}
