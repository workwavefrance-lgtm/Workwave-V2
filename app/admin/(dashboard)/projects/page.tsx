import { getAdminProjects } from "@/lib/queries/admin-projects";
import ProjectsTableClient from "./ProjectsTableClient";

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters = {
    status: sp.status || "all",
    search: sp.search || "",
    sort: sp.sort || "created_at",
    order: (sp.order || "desc") as "asc" | "desc",
    page: Math.max(1, parseInt(sp.page || "1", 10) || 1),
    pageSize: 25,
  };

  const result = await getAdminProjects(filters);

  return (
    <ProjectsTableClient
      initialData={result.data}
      initialCount={result.count}
      initialPage={result.page}
      initialTotalPages={result.totalPages}
      filters={filters}
    />
  );
}
