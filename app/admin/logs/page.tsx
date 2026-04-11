import { getAdminLogs } from "@/lib/queries/admin-logs";
import LogsClient from "./LogsClient";

export const metadata = {
  title: "Logs",
};

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const page = parseInt(sp.page || "1");
  const pageSize = 50;

  const result = await getAdminLogs(page, pageSize);

  return (
    <LogsClient
      initialData={result.data}
      initialCount={result.count}
      initialPage={result.page}
      initialTotalPages={result.totalPages}
    />
  );
}
