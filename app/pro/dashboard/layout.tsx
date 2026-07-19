import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAiProByUserId } from "@/lib/queries/pros";
import { getDashboardContext } from "@/lib/pro/dashboard-context";
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
  // Session + fiche BTP, mémoïsés pour toute la passe de rendu : les pages
  // appellent le même helper sans repayer l'aller-retour auth ni la requête
  // fiche (cf. lib/pro/dashboard-context.ts).
  // Anti-fuite vertical : getBtpProByUserId filtre category_id NOT IN
  // AI_CATEGORY_IDS. Symétrique au check côté AI. Audit 29/05/2026.
  const { user, pro } = await getDashboardContext();

  if (!user) {
    redirect("/pro/connexion");
  }

  if (!pro) {
    // Si l'user a une fiche AI (freelance), on l'envoie sur SON dashboard
    // au lieu de l'afficher le dashboard BTP avec une fiche AI.
    const aiPro = await getAiProByUserId(user.id);
    if (aiPro) {
      redirect("/ai/dashboard");
    }
    redirect("/pro/retrouver-fiche");
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

  // Le contexte est sérialisé dans le HTML envoyé au navigateur du pro. Les
  // identifiants Stripe n'y ont rien à faire : ils ne sont lus que par des
  // server actions (abonnement, déblocage), jamais par un composant client.
  // On les neutralise donc avant de passer la fiche au contexte.
  const proForClient = {
    ...pro,
    stripe_customer_id: null,
    stripe_subscription_id: null,
  };

  return (
    <DashboardProvider
      pro={proForClient}
      user={{ id: user.id, email: user.email ?? "" }}
    >
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
