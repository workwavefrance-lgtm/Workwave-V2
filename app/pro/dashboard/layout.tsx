import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getBtpProByUserId, getAiProByUserId } from "@/lib/queries/pros";
import DashboardProvider from "@/components/pro/dashboard/DashboardProvider";
import Sidebar from "@/components/pro/dashboard/Sidebar";
import BottomBar from "@/components/pro/dashboard/BottomBar";
import DashboardHeader from "@/components/pro/dashboard/DashboardHeader";
import ImpersonationBanner from "@/components/admin/shell/ImpersonationBanner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/pro/connexion");
  }

  // Anti-fuite vertical : on charge UNIQUEMENT la fiche BTP de cet user
  // (getBtpProByUserId filtre category_id NOT IN AI_CATEGORY_IDS). Symetrique
  // au check fait cote AI (app/(ai)/ai/dashboard/layout.tsx). Audit 29/05/2026.
  const pro = await getBtpProByUserId(user.id);

  if (!pro) {
    // Si l'user a une fiche AI (freelance), on l'envoie sur SON dashboard
    // au lieu de l'afficher le dashboard BTP avec une fiche AI.
    const aiPro = await getAiProByUserId(user.id);
    if (aiPro) {
      redirect("/ai/dashboard");
    }
    redirect("/pro/reclamer");
  }

  // Vérifier le cookie d'impersonation admin
  const cookieStore = await cookies();
  const impersonationRaw = cookieStore.get("admin_impersonation")?.value;
  let impersonationData = null;
  if (impersonationRaw) {
    try {
      impersonationData = JSON.parse(impersonationRaw);
    } catch {
      // Cookie malformé, ignorer
    }
  }

  return (
    <DashboardProvider pro={pro} user={{ id: user.id, email: user.email! }}>
      {impersonationData && <ImpersonationBanner data={impersonationData} />}
      <div
        className="min-h-screen flex bg-[var(--bg-primary)]"
        style={impersonationData ? { paddingTop: "40px" } : undefined}
      >
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <DashboardHeader />
          <main className="flex-1 p-6 lg:p-8 pb-24 lg:pb-8">
            {children}
          </main>
        </div>
        <BottomBar />
      </div>
    </DashboardProvider>
  );
}
