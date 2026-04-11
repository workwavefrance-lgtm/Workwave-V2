import { cache } from "react";
import { getAdminServiceClient } from "@/lib/admin/service-client";

export type AdminLogEntry = {
  id: number;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  details: Record<string, unknown> | null;
  created_at: string;
  admin: { email: string } | null;
};

export const getAdminLogs = cache(async (page = 1, pageSize = 50) => {
  const db = getAdminServiceClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = (await db
    .from("admin_logs")
    .select(
      "id, action, entity_type, entity_id, details, created_at, admin:admins(email)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to)) as unknown as {
    data: AdminLogEntry[] | null;
    count: number | null;
  };

  return {
    data: (data || []) as AdminLogEntry[],
    count: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
});
