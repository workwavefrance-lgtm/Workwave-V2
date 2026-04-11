"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAdmin } from "@/components/admin/shell/AdminProvider";
import { useState, useRef, useEffect } from "react";
import AdminMobileNav from "./AdminMobileNav";

const BREADCRUMB_LABELS: Record<string, string> = {
  admin: "Admin",
  pros: "Professionnels",
  projects: "Projets",
  leads: "Leads",
  finances: "Finances",
  analytics: "Analytics",
  alerts: "Alertes",
  logs: "Logs",
  settings: "Settings",
};

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { admin } = useAdmin();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Build breadcrumbs from pathname
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: BREADCRUMB_LABELS[seg] || (seg.length > 8 ? `#${seg.slice(0, 8)}` : seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  async function handleSignOut() {
    const res = await fetch("/api/admin/auth/check");
    if (res.ok) {
      // Clear admin cookie and redirect
      document.cookie = "admin_verified=; path=/; max-age=0";
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-[var(--admin-border)] bg-[var(--admin-card)]">
      {/* Mobile hamburger + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <AdminMobileNav />
        <nav className="flex items-center gap-1.5 text-xs">
        {breadcrumbs.map((crumb) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {crumb.href !== "/admin" && (
              <svg className="w-3 h-3 text-[var(--admin-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
            <span
              className={
                crumb.isLast
                  ? "text-[var(--admin-text)] font-medium"
                  : "text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)] cursor-pointer transition-colors duration-150"
              }
            >
              {crumb.label}
            </span>
          </span>
        ))}
        </nav>
      </div>

      {/* Right: Cmd+K hint + user menu */}
      <div className="flex items-center gap-4">
        <button
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--admin-hover)] border border-[var(--admin-border)] text-[var(--admin-text-tertiary)] text-xs hover:text-[var(--admin-text-secondary)] transition-colors duration-150"
          onClick={() => {
            // Will be connected to command palette later
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
          }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <span className="font-mono text-[10px]">⌘K</span>
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-7 h-7 rounded-full bg-[var(--admin-accent)]/20 flex items-center justify-center hover:ring-2 hover:ring-[var(--admin-accent)]/30 transition-all duration-150"
          >
            <span className="text-[var(--admin-accent)] font-semibold text-xs">
              {admin.email.charAt(0).toUpperCase()}
            </span>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-xl shadow-xl py-1 z-50">
              <div className="px-3 py-2 border-b border-[var(--admin-border)]">
                <p className="text-xs font-medium text-[var(--admin-text)] truncate">
                  {admin.email}
                </p>
                <p className="text-[10px] text-[var(--admin-text-tertiary)] uppercase">
                  {admin.role}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-xs text-[var(--admin-danger)] hover:bg-[var(--admin-hover)] transition-colors duration-150"
              >
                Se deconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
