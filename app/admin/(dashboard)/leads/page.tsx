import { getAdminLeads } from "@/lib/queries/admin-leads";
import LeadsTableClient from "./LeadsTableClient";

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters = {
    status: sp.status || "all",
    sort: sp.sort || "sent_at",
    order: (sp.order || "desc") as "asc" | "desc",
    page: Math.max(1, parseInt(sp.page || "1", 10) || 1),
    pageSize: 25,
  };

  const result = await getAdminLeads(filters);

  return (
    <LeadsTableClient
      initialData={result.data}
      initialCount={result.count}
      initialPage={result.page}
      initialTotalPages={result.totalPages}
      filters={filters}
    />
  );
}
