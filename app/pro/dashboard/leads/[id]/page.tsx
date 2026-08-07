import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLeadById } from "@/lib/queries/leads";
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
  // On rend un état "introuvable" EN LIGNE plutôt que notFound() : avec un
  // loading.tsx au-dessus, notFound() streamerait le squelette en 200 et
  // l'utilisateur resterait bloqué dessus (leçon 18/04). Ici il reste dans le
  // dashboard, avec un retour évident.
  const lead = !isNaN(leadId) ? await getLeadById(leadId, pro.id) : null;
  if (!lead) {
    return (
      <div className="max-w-xl">
        <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          Lead introuvable
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Ce lead n&apos;existe pas, ou il ne vous est pas attribué.
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

  const db = getAdminServiceClient();

  // ── VERROU PAYANT ──────────────────────────────────────────────────────────
  // Le modèle BTP est du pay-per-lead : les coordonnées du particulier ne se
  // révèlent qu'après un déblocage (9,90 € ou l'un des 2 offerts). La LISTE
  // (leads/page.tsx) applique bien cette règle ; cette page de détail, elle,
  // ne la vérifiait pas — il suffisait de taper /pro/dashboard/leads/<id> pour
  // lire email et téléphone en clair. Mesuré le 07/08/2026 : 100 leads sur 105
  // exposaient un email jamais payé, dont 19 de projets supprimés par leur
  // auteur. Le filtrage se fait ICI, côté serveur : masquer dans le composant
  // client ne suffirait pas, les valeurs partiraient quand même dans la page.

  // 1. Projet supprimé par le particulier (RGPD) : plus rien ne doit en sortir.
  //    La jointure le ramène quand même, donc le garde `!project` du composant
  //    ne se déclenche pas — il faut le traiter ici.
  if (!lead.project || lead.project.status === "deleted") {
    return (
      <div className="max-w-xl">
        <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          Ce projet n&apos;est plus disponible
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Le particulier a retiré sa demande. Merci de ne pas le contacter.
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

  // 2. Ce pro a-t-il débloqué CE projet ?
  const { data: unlock } = await db
    .from("lead_unlocks")
    .select("id")
    .eq("pro_id", pro.id)
    .eq("project_id", lead.project.id)
    .maybeSingle();
  const unlocked = Boolean(unlock);

  // 3. Sinon : on retire les coordonnées de l'objet avant tout rendu, et on
  //    substitue la description nettoyée (même règle que la liste : un client
  //    laisse parfois son numéro dans le texte libre).
  const freeRemaining = unlocked ? 0 : await getFreeUnlocksRemaining(db, pro.id);
  if (!unlocked) {
    const p = lead.project as typeof lead.project & {
      cleaned_description: string | null;
      has_contact_in_description: boolean | null;
    };
    // Chaînes vides plutôt que null : le type Project les déclare non-nullables,
    // et le composant ne les rend de toute façon que dans la branche débloquée.
    lead.project = {
      ...lead.project,
      first_name: "",
      email: "",
      phone: "",
      description: p.has_contact_in_description
        ? p.cleaned_description || ""
        : lead.project.description,
    };
  }

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
