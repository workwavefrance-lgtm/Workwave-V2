import { getAdminTickets, getTicketStatusCounts } from "@/lib/queries/admin-support";
import SupportInboxClient from "./SupportInboxClient";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters = {
    status: sp.status || "open",
    search: sp.search || "",
    page: Math.max(1, parseInt(sp.page || "1", 10) || 1),
    pageSize: 25,
  };
  const [result, counts] = await Promise.all([
    getAdminTickets(filters),
    getTicketStatusCounts(),
  ]);

  return (
    <SupportInboxClient
      initialData={result.data}
      initialCount={result.count}
      initialPage={result.page}
      initialTotalPages={result.totalPages}
      counts={counts}
      filters={filters}
    />
  );
}
