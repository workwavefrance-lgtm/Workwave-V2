import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProByUserId } from "@/lib/queries/pros";
import DashboardProvider from "@/components/pro/dashboard/DashboardProvider";
import Sidebar from "@/components/pro/dashboard/Sidebar";
import BottomBar from "@/components/pro/dashboard/BottomBar";
import DashboardHeader from "@/components/pro/dashboard/DashboardHeader";

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

  return (
    <DashboardProvider pro={pro} user={{ id: user.id, email: user.email! }}>
      <div className="min-h-screen flex bg-[var(--bg-primary)]">
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
