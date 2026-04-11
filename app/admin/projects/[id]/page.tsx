import { notFound } from "next/navigation";
import { getAdminProjectById } from "@/lib/queries/admin-projects";
import ProjectDetailClient from "./ProjectDetailClient";

export default async function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projId = parseInt(id);
  if (isNaN(projId)) notFound();

  const result = await getAdminProjectById(projId);
  if (!result) notFound();

  return <ProjectDetailClient project={result.project} leads={result.leads} />;
}
