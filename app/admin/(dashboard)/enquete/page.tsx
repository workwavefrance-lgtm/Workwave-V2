import { getAdminServiceClient } from "@/lib/admin/service-client";
import type { ProSurveyResponse } from "@/lib/types/database";
import EnqueteClient from "./EnqueteClient";

export const dynamic = "force-dynamic";

export default async function AdminEnquetePage() {
  const db = getAdminServiceClient();
  const { data } = await db
    .from("pro_survey_responses")
    .select("*")
    .order("created_at", { ascending: false });

  return <EnqueteClient responses={(data || []) as unknown as ProSurveyResponse[]} />;
}
