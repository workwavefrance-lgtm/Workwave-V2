import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProByUserId } from "@/lib/queries/pros";
import { getLeadById } from "@/lib/queries/leads";
import LeadDetail from "@/components/pro/dashboard/LeadDetail";
import { markLeadOpened } from "./actions";

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
  if (!pro) redirect("/pro/reclamer");

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) notFound();

  const lead = await getLeadById(leadId, pro.id);
  if (!lead) notFound();

  // Marquer comme vu si c'est le premier accès
  if (lead.status === "sent") {
    await markLeadOpened(lead.id);
  }

  return <LeadDetail lead={lead} />;
}
