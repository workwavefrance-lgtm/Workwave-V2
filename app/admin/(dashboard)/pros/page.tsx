import { getAdminPros } from "@/lib/queries/admin-pros";
import ProsTableClient from "./ProsTableClient";

export default async function AdminProsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters = {
    status: sp.status || "all",
    claimed: sp.claimed || "all",
    search: sp.search || "",
    sort: sp.sort || "created_at",
    order: (sp.order || "desc") as "asc" | "desc",
    page: parseInt(sp.page || "1"),
    pageSize: 25,
  };

  const result = await getAdminPros(filters);

  return (
    <ProsTableClient
      initialData={result.data}
      initialCount={result.count}
      initialPage={result.page}
      initialTotalPages={result.totalPages}
      filters={filters}
    />
  );
}
