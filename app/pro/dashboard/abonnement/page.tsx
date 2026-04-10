import type { Metadata } from "next";
import AbonnementView from "@/components/pro/dashboard/AbonnementView";

export const metadata: Metadata = {
  title: "Abonnement — Workwave Pro",
  robots: { index: false, follow: false },
};

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const params = await searchParams;

  return (
    <AbonnementView
      successParam={params.success === "true"}
      canceledParam={params.canceled === "true"}
    />
  );
}
