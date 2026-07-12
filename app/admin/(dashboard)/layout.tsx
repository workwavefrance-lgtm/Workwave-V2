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
      className="admin-shell dark h-screen flex overflow-hidden"
      style={
        {
          // Palette « Nova » — dark futuriste, accent coral marque (#FF5A36),
          // unifiée (fini les 3 oranges + les restes verts). Refonte 13/07.
          "--admin-bg": "#08090C",
          "--admin-card": "#14161B",
          "--admin-card-hi": "#191C22",
          "--admin-border": "#23262F",
          "--admin-border-strong": "#2F333D",
          "--admin-hover": "#1A1D24",
          "--admin-text": "#F3F5F8",
          "--admin-text-secondary": "#9AA3B2",
          "--admin-text-tertiary": "#5C6472",
          "--admin-accent": "#FF5A36",
          "--admin-accent-hover": "#FF7452",
          "--admin-accent-soft": "rgba(255,90,54,0.14)",
          "--admin-danger": "#FB6E5B",
          "--admin-warning": "#FBBF24",
          "--admin-success": "#34D399",
        } as React.CSSProperties
      }
    >
      <style>{`
        .admin-shell, .admin-shell * {
          color-scheme: dark;
        }
        .admin-shell {
          background:
            radial-gradient(820px 420px at 12% -8%, rgba(255,90,54,0.09), transparent 60%),
            radial-gradient(720px 460px at 100% 0%, rgba(79,216,232,0.05), transparent 55%),
            var(--admin-bg);
          color: var(--admin-text);
          font-variant-numeric: tabular-nums;
        }
        .admin-shell ::-webkit-scrollbar { width: 7px; height: 7px; }
        .admin-shell ::-webkit-scrollbar-track { background: transparent; }
        .admin-shell ::-webkit-scrollbar-thumb {
          background: var(--admin-border-strong);
          border-radius: 4px;
        }
        .admin-shell ::-webkit-scrollbar-thumb:hover { background: var(--admin-text-tertiary); }
      `}</style>

      <ToastProvider>
        <CommandPaletteProvider>
          <AdminProvider admin={admin}>
            <AdminSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <AdminHeader />
              <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-24 lg:p-6 lg:pb-6">
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
