import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProByUserId } from "@/lib/queries/pros";
import { getLeadsForPro } from "@/lib/queries/leads";
import type { ProjectLeadStatus } from "@/lib/types/database";
import LeadsList from "@/components/pro/dashboard/LeadsList";

export const metadata: Metadata = {
  title: "Leads reçus — Workwave Pro",
  robots: { index: false, follow: false },
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/pro/connexion");

  const pro = await getProByUserId(user.id);
  if (!pro) redirect("/pro/reclamer");

  const params = await searchParams;
  const validStatuses: ProjectLeadStatus[] = [
    "sent",
    "opened",
    "contacted",
    "not_relevant",
  ];
  const status = validStatuses.includes(params.status as ProjectLeadStatus)
    ? (params.status as ProjectLeadStatus)
    : undefined;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const result = await getLeadsForPro(pro.id, { status, page });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          Leads reçus
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Retrouvez ici toutes les demandes de clients qui vous ont été envoyées
        </p>
      </div>

      <LeadsList
        leads={result.data}
        totalPages={result.totalPages}
        currentPage={result.page}
        currentStatus={status || null}
      />
    </div>
  );
}
