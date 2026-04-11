import { redirect } from "next/navigation";
import { verifyAdmin } from "@/lib/admin/auth";
import AdminProvider from "@/components/admin/shell/AdminProvider";
import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import CommandPaletteProvider from "@/components/admin/command-palette/CommandPaletteProvider";
import CommandPalette from "@/components/admin/command-palette/CommandPalette";

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
          "--admin-bg": "#0A0A0A",
          "--admin-card": "#111111",
          "--admin-border": "#1F1F1F",
          "--admin-hover": "#1A1A1A",
          "--admin-text": "#FAFAFA",
          "--admin-text-secondary": "#737373",
          "--admin-text-tertiary": "#404040",
          "--admin-accent": "#10B981",
          "--admin-danger": "#EF4444",
          "--admin-warning": "#F59E0B",
        } as React.CSSProperties
      }
    >
      <style>{`
        .admin-shell, .admin-shell * {
          color-scheme: dark;
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
          background: var(--admin-border);
          border-radius: 3px;
        }
        .admin-shell ::-webkit-scrollbar-thumb:hover {
          background: var(--admin-text-tertiary);
        }
      `}</style>

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
    </div>
  );
}
