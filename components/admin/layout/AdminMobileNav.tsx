"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Overview", href: "/admin", exact: true },
  { label: "Professionnels", href: "/admin/pros" },
  { label: "Projets", href: "/admin/projects" },
  { label: "Leads", href: "/admin/leads" },
  { label: "Finances", href: "/admin/finances" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Alertes", href: "/admin/alerts" },
  { label: "Logs", href: "/admin/logs" },
  { label: "Settings", href: "/admin/settings" },
];

export default function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fermer quand on navigue
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bloquer le scroll quand ouvert
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150"
        style={{ color: "var(--admin-text-secondary)" }}
        aria-label="Ouvrir le menu"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[150] lg:hidden"
          onClick={() => setOpen(false)}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        />
      )}

      {/* Slide-over panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-[151] w-64 lg:hidden transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          backgroundColor: "var(--admin-card)",
          borderRight: "1px solid var(--admin-border)",
        }}
      >
        {/* Header */}
        <div
          className="h-14 flex items-center justify-between px-4"
          style={{ borderBottom: "1px solid var(--admin-border)" }}
        >
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ color: "var(--admin-text)" }}
          >
            Workwave Admin
          </span>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150"
            style={{ color: "var(--admin-text-secondary)" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-4 py-2.5 text-sm font-medium transition-colors duration-150"
                style={{
                  color: isActive
                    ? "var(--admin-accent)"
                    : "var(--admin-text-secondary)",
                  backgroundColor: isActive
                    ? "rgba(16, 185, 129, 0.1)"
                    : "transparent",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
