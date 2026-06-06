import { notFound } from "next/navigation";
import { getAdminProById } from "@/lib/queries/admin-pros";
import { getAllCategories } from "@/lib/queries/categories";
import ProDetailClient from "./ProDetailClient";

export default async function AdminProDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proId = parseInt(id);
  if (isNaN(proId)) notFound();

  const [result, allCategories] = await Promise.all([
    getAdminProById(proId),
    getAllCategories(),
  ]);
  if (!result) notFound();

  return (
    <ProDetailClient
      pro={result.pro}
      unlocks={result.unlocks}
      categories={allCategories.map((c) => ({
        id: c.id,
        name: c.name,
        vertical: c.vertical,
      }))}
    />
  );
}
