import { cache } from "react";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import type { ProjectStatus } from "@/lib/types/database";

export type AdminProjectRow = {
  id: number;
  first_name: string;
  email: string;
  phone: string;
  description: string;
  urgency: string;
  budget: string;
  status: ProjectStatus;
  suspicion_score: number | null;
  ai_qualification: { summary?: string } | null;
  created_at: string;
  category: { id: number; name: string } | null;
  city: { id: number; name: string; department: { code: string } | null } | null;
};

export type AdminProjectsFilters = {
  status?: string;
  category?: string;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export const getAdminProjects = cache(
  async (filters: AdminProjectsFilters = {}) => {
    const db = getAdminServiceClient();
    const {
      status = "all",
      search = "",
      sort = "created_at",
      order = "desc",
      page = 1,
      pageSize = 25,
    } = filters;

    let query = db
      .from("projects")
      .select(
        "id, first_name, email, phone, description, urgency, budget, status, suspicion_score, ai_qualification, created_at, category:categories(id, name), city:cities(id, name, department:departments(code))",
        { count: "exact" }
      )
      .is("deleted_at" as never, null);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,description.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const validSorts = ["created_at", "status", "suspicion_score"];
    const sortCol = validSorts.includes(sort) ? sort : "created_at";
    query = query.order(sortCol, { ascending: order === "asc" });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count } = await query;

    return {
      data: (data || []) as unknown as AdminProjectRow[],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }
);

export const getAdminProjectById = cache(async (id: number) => {
  const db = getAdminServiceClient();

  const { data: project } = await db
    .from("projects")
    .select(
      "*, category:categories(*), city:cities(*, department:departments(*))"
    )
    .eq("id", id)
    .single();

  if (!project) return null;

  const { data: leads } = await db
    .from("project_leads")
    .select("*, pro:pros(id, name, slug, email, phone, subscription_status)")
    .eq("project_id", id)
    .order("sent_at", { ascending: false });

  return {
    project: project as Record<string, unknown>,
    leads: (leads || []) as unknown as {
      id: number;
      status: string;
      sent_at: string;
      opened_at: string | null;
      contacted_at: string | null;
      pro: { id: number; name: string; slug: string; email: string | null; phone: string | null; subscription_status: string } | null;
    }[],
  };
});
