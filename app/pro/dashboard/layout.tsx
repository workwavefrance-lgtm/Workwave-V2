import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getProByUserId } from "@/lib/queries/pros";
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

  const pro = await getProByUserId(user.id);

  if (!pro) {
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
