import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function TestPage() {
  let connectionStatus = "Non testé";
  let details = "";

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();

    if (error) {
      connectionStatus = "Erreur";
      details = error.message;
    } else {
      connectionStatus = "Connecté";
      details = "La connexion à Supabase fonctionne correctement.";
    }
  } catch (e) {
    connectionStatus = "Échec";
    details = e instanceof Error ? e.message : "Erreur inconnue";
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-8">Test de connexion Supabase</h1>
      <div className="border rounded-lg p-6 max-w-md w-full">
        <p className="mb-2">
          <span className="font-semibold">Statut : </span>
          <span
            className={
              connectionStatus === "Connecté"
                ? "text-green-600"
                : "text-red-600"
            }
          >
            {connectionStatus}
          </span>
        </p>
        <p className="text-sm text-zinc-600">{details}</p>
      </div>
      <Link
        href="/"
        className="mt-6 text-blue-600 hover:text-blue-800 underline"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
