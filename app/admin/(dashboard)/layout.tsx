import "./admin.css";
import { redirect } from "next/navigation";
import { verifyAdmin } from "@/lib/admin/auth";
import AdminProvider from "@/components/admin/shell/AdminProvider";
import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import AdminBottomBar from "@/components/admin/layout/AdminBottomBar";
import CommandPaletteProvider from "@/components/admin/command-palette/CommandPaletteProvider";
import CommandPalette from "@/components/admin/command-palette/CommandPalette";
import { ToastProvider } from "@/components/admin/shell/AdminToast";

export const dynamic = "force-dynamic";

export const metadata = {
  title: {
    default: "Admin · Workwave",
    template: "%s | Admin Workwave",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await verifyAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <div className="admin-shell h-dvh flex overflow-hidden">
      <a className="admin-skip-link" href="#admin-content">Aller au contenu</a>
      <ToastProvider>
        <CommandPaletteProvider>
          <AdminProvider admin={admin}>
            <AdminSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <AdminHeader />
              <main id="admin-content" tabIndex={-1} className="admin-content flex-1 min-h-0 overflow-y-auto">
                {children}
              </main>
            </div>
            <AdminBottomBar />
          </AdminProvider>
          <CommandPalette />
        </CommandPaletteProvider>
      </ToastProvider>
    </div>
  );
}
