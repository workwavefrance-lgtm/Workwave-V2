import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Workwave V2</h1>
      <p className="text-lg text-zinc-600 mb-8">
        Plateforme de mise en relation avec des professionnels locaux
      </p>
      <Link
        href="/test"
        className="text-blue-600 hover:text-blue-800 underline"
      >
        Page de test Supabase
      </Link>
    </main>
  );
}
