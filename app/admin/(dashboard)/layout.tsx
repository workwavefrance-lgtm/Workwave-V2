import { redirect } from "next/navigation";
import { verifyAdmin } from "@/lib/admin/auth";
import AdminProvider from "@/components/admin/shell/AdminProvider";
import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import CommandPaletteProvider from "@/components/admin/command-palette/CommandPaletteProvider";
import CommandPalette from "@/components/admin/command-palette/CommandPalette";
import { ToastProvider } from "@/components/admin/shell/AdminToast";

export const dynamic = "force-dynamic";

export const metadata = {
  title: {
    default: "Admin — Workwave",
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
    <div
      className="admin-shell h-screen flex overflow-hidden"
      style={
        {
          // Palette Pixel Rise — alignee avec /ai/dashboard (style clair,
          // accent orange Workwave, contraste eleve)
          "--admin-bg": "#FAFAFA",
          "--admin-card": "#FFFFFF",
          "--admin-border": "#E5E5E5",
          "--admin-border-strong": "#D4D4D4",
          "--admin-hover": "#F5F5F5",
          "--admin-text": "#0A0A0A",
          "--admin-text-secondary": "#525252",
          "--admin-text-tertiary": "#999999",
          "--admin-accent": "#FF6803",
          "--admin-accent-hover": "#E55A00",
          "--admin-danger": "#DC2626",
          "--admin-warning": "#F59E0B",
          "--admin-success": "#16A34A",
        } as React.CSSProperties
      }
    >
      <style>{`
        .admin-shell, .admin-shell * {
          color-scheme: light;
        }
        .admin-shell {
          background: var(--admin-bg);
          color: var(--admin-text);
          font-variant-numeric: tabular-nums;
        }
        .admin-shell ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .admin-shell ::-webkit-scrollbar-track {
          background: transparent;
        }
        .admin-shell ::-webkit-scrollbar-thumb {
          background: var(--admin-border-strong);
          border-radius: 3px;
        }
        .admin-shell ::-webkit-scrollbar-thumb:hover {
          background: var(--admin-text-tertiary);
        }
      `}</style>

      <ToastProvider>
        <CommandPaletteProvider>
          <AdminProvider admin={admin}>
            <AdminSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <AdminHeader />
              <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
          </AdminProvider>
          <CommandPalette />
        </CommandPaletteProvider>
      </ToastProvider>
    </div>
  );
}
