import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service-client";

export const metadata: Metadata = { title: "Mes demandes de rattachement · Workwave", robots: { index: false, follow: false } };

export default async function MyClaimRequestsPage() {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) redirect("/pro/connexion");
  const { data, error } = await getServiceClient().from("pro_claim_requests")
    .select("id, status, created_at, pro:pros(name, slug)")
    .eq("requester_user_id", user.id).order("created_at", { ascending: false }).limit(50);
  return <main className="max-w-2xl mx-auto px-4 py-16 space-y-6">
    <h1 className="text-2xl font-bold">Mes demandes de rattachement</h1>
    <p>Votre email est vérifié. L&apos;équipe Workwave doit maintenant confirmer votre lien avec l&apos;entreprise avant de vous donner accès à sa fiche.</p>
    {error ? <p role="alert">Le suivi est momentanément indisponible. Contactez contact@workwave.fr.</p>
      : !data?.length ? <p>Aucune demande enregistrée. <Link href="/pro/retrouver-fiche" className="underline">Retrouver votre fiche</Link></p>
      : data.map((request) => {
        const pro = Array.isArray(request.pro) ? request.pro[0] : request.pro;
        return <section key={request.id} className="border border-[var(--border-color)] rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">{pro?.name} · Demande n°{request.id}</h2>
          {request.status === "approved" ? <p>Demande approuvée. <Link href="/pro/dashboard/fiche" className="underline">Accéder à votre espace</Link></p>
            : request.status === "rejected" ? <p>Cette demande n&apos;a pas été approuvée. Contactez-nous si vous souhaitez apporter des éléments complémentaires.</p>
            : <p>En attente de vérification. Pour faciliter le traitement, écrivez-nous depuis votre adresse professionnelle en précisant votre fonction et le numéro de cette demande. Nous vous indiquerons les éléments nécessaires.</p>}
          <a className="underline" href={`mailto:contact@workwave.fr?subject=${encodeURIComponent(`Rattachement Workwave — demande ${request.id}`)}`}>Contacter l&apos;équipe</a>
        </section>;
      })}
  </main>;
}
