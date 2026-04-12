import { notFound } from "next/navigation";
import { getAdminProById } from "@/lib/queries/admin-pros";
import ProDetailClient from "./ProDetailClient";

export default async function AdminProDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proId = parseInt(id);
  if (isNaN(proId)) notFound();

  const result = await getAdminProById(proId);
  if (!result) notFound();

  return <ProDetailClient pro={result.pro} leads={result.leads} />;
}
