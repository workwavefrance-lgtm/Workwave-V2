import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import VerificationForm from "@/components/pro/VerificationForm";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ attempt?: string }>;
};

export const metadata: Metadata = {
  title: "Vérification — Workwave",
  robots: { index: false, follow: false },
};

export default async function VerificationPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { attempt } = await searchParams;

  if (!attempt) notFound();

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      {/* Retour */}
      <Link
        href={`/pro/reclamer/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors duration-250 mb-8"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Recommencer
      </Link>

      {/* Card */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-8">
        {/* Icône email */}
        <div className="w-16 h-16 rounded-full bg-[var(--accent-muted)] flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <VerificationForm attemptId={attempt} slug={slug} />
      </div>
    </main>
  );
}
