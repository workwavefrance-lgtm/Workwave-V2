import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <h1 className="text-3xl font-bold text-zinc-900 mb-4">
        Professionnel introuvable
      </h1>
      <p className="text-zinc-600 mb-8">
        Cette fiche n&apos;existe pas ou a été supprimée.
      </p>
      <Link
        href="/"
        className="bg-zinc-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
