import { cache } from "react";
import { getAdminServiceClient } from "@/lib/admin/service-client";

export type AdminLeadRow = {
  id: number;
  status: string;
  sent_at: string;
  opened_at: string | null;
  contacted_at: string | null;
  project: {
    id: number;
    first_name: string;
    description: string;
    status: string;
    created_at: string;
  } | null;
  pro: {
    id: number;
    name: string;
    slug: string;
  } | null;
};

export type AdminLeadsFilters = {
  status?: string;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export const getAdminLeads = cache(
  async (filters: AdminLeadsFilters = {}) => {
    const db = getAdminServiceClient();
    const {
      status = "all",
      sort = "sent_at",
      order = "desc",
      page = 1,
      pageSize = 25,
    } = filters;

    let query = db
      .from("project_leads")
      .select(
        "id, status, sent_at, opened_at, contacted_at, project:projects(id, first_name, description, status, created_at), pro:pros(id, name, slug)",
        { count: "exact" }
      );

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const validSorts = ["sent_at", "status"];
    const sortCol = validSorts.includes(sort) ? sort : "sent_at";
    query = query.order(sortCol, { ascending: order === "asc" });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count } = await query;

    return {
      data: (data || []) as unknown as AdminLeadRow[],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }
);
