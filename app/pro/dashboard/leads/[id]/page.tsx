import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLeadForPro } from "@/lib/queries/leads";
import { getDashboardContext } from "@/lib/pro/dashboard-context";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { getFreeUnlocksRemaining } from "@/lib/billing/free-unlocks";
import LeadDetail from "@/components/pro/dashboard/LeadDetail";

export const metadata: Metadata = {
  title: "Détail du lead — Workwave Pro",
  robots: { index: false, follow: false },
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Mémoïsé par le layout : aucun aller-retour auth ni requête en plus.
  const { pro } = await getDashboardContext();
  if (!pro) redirect("/pro/connexion");

  const { id } = await params;
  const leadId = parseInt(id, 10);

  // getLeadForPro porte le verrou payant : si ce pro n'a pas débloqué ce
  // projet, les coordonnées ne sortent tout simplement pas de la requête.
  // Cette page ne décide RIEN sur la sécurité — elle affiche. C'est voulu :
  // une vérification qu'une page peut oublier finit par être oubliée (c'est
  // exactement ce qui est arrivé ici avant le 08/08/2026).
  const result = !isNaN(leadId) ? await getLeadForPro(leadId, pro.id) : null;

  // On rend un état "introuvable" EN LIGNE plutôt que notFound() : avec un
  // loading.tsx au-dessus, notFound() streamerait le squelette en 200 et
  // l'utilisateur resterait bloqué dessus (leçon 18/04). Ici il reste dans le
  // dashboard, avec un retour évident. Couvre aussi le projet retiré par son
  // auteur : getLeadForPro renvoie null, donc rien n'en sort.
  if (!result) {
    return (
      <div className="max-w-xl">
        <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          Lead introuvable
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Ce lead n&apos;existe pas, ne vous est pas attribué, ou le particulier
          a retiré sa demande.
        </p>
        <Link
          href="/pro/dashboard/leads"
          className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200"
        >
          Retour à mes leads
        </Link>
      </div>
    );
  }

  const { lead, unlocked } = result;
  const db = getAdminServiceClient();
  const freeRemaining = unlocked ? 0 : await getFreeUnlocksRemaining(db, pro.id);

  // Marquer comme vu si c'est le premier accès (inline, pas de server action)
  if (lead.status === "sent") {
    await db
      .from("project_leads")
      .update({ status: "opened", opened_at: new Date().toISOString() } as never)
      .eq("id", lead.id)
      .eq("pro_id", pro.id)
      .eq("status", "sent");
    lead.status = "opened";
  }

  return (
    <LeadDetail lead={lead} unlocked={unlocked} freeRemaining={freeRemaining} />
  );
}
