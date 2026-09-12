import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyAdmin } from "@/lib/admin/auth";
import { getServiceClient } from "@/lib/supabase/service-client";
import { reviewClaim } from "./actions";

export default async function ClaimReviewsPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  if (!await verifyAdmin()) redirect("/admin/login");
  const { result } = await searchParams;
  const { data, error } = await getServiceClient().from("pro_claim_requests")
    .select("id, verified_email, created_at, pro:pros(name, slug, siret, phone, website)")
    .eq("status", "pending").order("created_at").limit(100);
  const messages: Record<string, string> = {
    saved: "Décision enregistrée.",
    incomplete: "Ajoutez une note de vérification (10 caractères minimum). Pour approuver, confirmez le lien avec l'entreprise.",
    conflict: "Décision refusée : demande déjà traitée, fiche indisponible ou données modifiées. Rechargez et vérifiez la demande.",
  };
  return <main className="max-w-4xl mx-auto p-6 space-y-6">
    <h1 className="text-2xl font-bold">Rattachements à vérifier</h1>
    <p>Le code email a été validé. Avant d&apos;approuver, vérifiez que le demandeur représente l&apos;entreprise, par exemple par un rappel sur un numéro professionnel trouvé indépendamment ou un justificatif vérifié. Le SIRET public et un email libre ne suffisent pas.</p>
    {result && messages[result] && <p role="status" className="border rounded-xl p-4">{messages[result]}</p>}
    {error ? <p role="alert">Impossible de charger les demandes. Vérifiez que la migration de validation manuelle est installée.</p>
      : !data?.length ? <p>Aucune demande en attente.</p>
      : data.map((request) => {
        const pro = Array.isArray(request.pro) ? request.pro[0] : request.pro;
        return <section key={request.id} className="border border-[var(--border-color)] rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Demande n°{request.id} · {pro?.name}</h2>
          <p>Email vérifié : {request.verified_email}<br />SIRET / BCE : {pro?.siret}<br />Reçue le {new Date(request.created_at).toLocaleDateString("fr-FR")}</p>
          <Link className="underline" href={`/artisan/${pro?.slug}`}>Consulter la fiche publique</Link>
          <form action={reviewClaim} className="space-y-3">
            <input type="hidden" name="requestId" value={request.id} />
            <label className="block">Note interne : preuve contrôlée ou motif du refus
              <textarea name="note" required minLength={10} maxLength={2000} className="block w-full border rounded p-3 bg-[var(--bg-primary)]" placeholder="Méthode et résultat de la vérification. Ne recopiez pas de document d'identité." />
            </label>
            <label className="flex gap-2"><input type="checkbox" name="ownershipVerified" />J&apos;ai vérifié le lien du demandeur avec cette entreprise.</label>
            <div className="flex gap-3">
              <button name="decision" value="approved" className="rounded px-4 py-2 bg-green-700 text-white">Approuver et rattacher</button>
              <button name="decision" value="rejected" className="rounded px-4 py-2 border">Refuser</button>
            </div>
          </form>
        </section>;
      })}
    {data?.length === 100 && <p>Les 100 demandes les plus anciennes sont affichées. Les suivantes apparaîtront après traitement.</p>}
  </main>;
}
