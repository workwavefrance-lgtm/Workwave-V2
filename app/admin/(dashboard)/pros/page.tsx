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
    vertical: sp.vertical || "all",
    source: sp.source || "all",
    // Par défaut on ouvre sur les pros RÉCLAMÉS (les vrais inscrits, ce que Willy
    // veut voir) plutôt que les 2,4M fiches scrapées. « Tous » / « Non réclamés »
    // restent accessibles via les onglets.
    state: sp.state || "claimed",
    search: sp.search || "",
    // sort "id" (et pas "created_at") : laisse getAdminPros basculer sur claimed_at
    // en vue Réclamés (derniers inscrits en haut) ET garder id DESC = instantané
    // sur les vues scrapées (2,4M lignes, PK). Voir admin-pros.ts:158-163.
    sort: sp.sort || "id",
    order: (sp.order || "desc") as "asc" | "desc",
    page: Math.max(1, parseInt(sp.page || "1", 10) || 1),
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
