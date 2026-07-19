import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProByUserId } from "@/lib/queries/pros";
import { getLeadById } from "@/lib/queries/leads";
import { getAdminServiceClient } from "@/lib/admin/service-client";
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/pro/connexion");

  const pro = await getProByUserId(user.id);
  if (!pro) redirect("/pro");

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

  // Marquer comme vu si c'est le premier accès (inline, pas de server action)
  if (lead.status === "sent") {
    const db = getAdminServiceClient();
    await db
      .from("project_leads")
      .update({ status: "opened", opened_at: new Date().toISOString() } as never)
      .eq("id", lead.id)
      .eq("pro_id", pro.id)
      .eq("status", "sent");
    lead.status = "opened";
  }

  return <LeadDetail lead={lead} />;
}
