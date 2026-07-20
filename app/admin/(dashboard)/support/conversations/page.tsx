import { getLeaConversations, getLeaFlagCounts } from "@/lib/queries/admin-lea-journal";
import LeaJournalClient from "./LeaJournalClient";

export const dynamic = "force-dynamic";

export default async function LeaJournalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters = {
    flag: sp.flag ?? "todo",
    page: Math.max(1, parseInt(sp.page || "1", 10) || 1),
    pageSize: 20,
  };
  const [result, counts] = await Promise.all([
    getLeaConversations(filters),
    getLeaFlagCounts(),
  ]);

  return (
    <LeaJournalClient
      rows={result.data}
      count={result.count}
      page={filters.page}
      totalPages={result.totalPages}
      flag={filters.flag}
      counts={counts}
    />
  );
}
