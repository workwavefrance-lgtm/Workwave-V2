"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ADMIN_NAV_PRIMARY,
  ADMIN_NAV_SECONDARY,
  isNavActive,
} from "./nav-config";

/**
 * Barre d'onglets mobile (refonte 13/07) — navigation au pouce, remplace le
 * burger + slide-over. 4 espaces principaux + « Plus » (feuille remontante avec
 * les espaces secondaires). Masquée en desktop (lg:hidden, le sidebar prend le relais).
 */
export default function AdminBottomBar() {
  const pathname = usePathname();
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    setSheet(false);
  }, [pathname]);

  const plusActive = ADMIN_NAV_SECONDARY.some((i) => isNavActive(i, pathname));

  return (
    <>
      {/* Feuille « Plus » */}
      {sheet && (
        <div className="lg:hidden fixed inset-0 z-[160]" onClick={() => setSheet(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,.55)", backdropFilter: "blur(2px)" }} />
          <div
            className="absolute left-0 right-0 bottom-0 rounded-t-3xl p-4 pb-8 animate-in slide-in-from-bottom-4"
            style={{
              background: "var(--admin-card)",
              borderTop: "1px solid var(--admin-border-strong)",
              boxShadow: "0 -20px 50px -10px rgba(0,0,0,.7)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--admin-border-strong)" }} />
            <div className="grid grid-cols-3 gap-2.5">
              {ADMIN_NAV_SECONDARY.map((item) => {
                const active = isNavActive(item, pathname);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="flex flex-col items-center gap-2 rounded-2xl py-3.5 transition-colors"
                    style={{
                      background: active ? "var(--admin-accent-soft)" : "var(--admin-hover)",
                      color: active ? "var(--admin-accent)" : "var(--admin-text-secondary)",
                      border: `1px solid ${active ? "var(--admin-accent)" : "var(--admin-border)"}`,
                    }}
                  >
                    <span className="w-6 h-6">{item.icon}</span>
                    <span className="text-[11px] font-semibold">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Barre */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[155] flex items-stretch"
        style={{
          background: "rgba(10,11,15,.86)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid var(--admin-border)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {ADMIN_NAV_PRIMARY.map((item) => {
          const active = isNavActive(item, pathname);
          return (
            <Link
              key={item.key}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 pt-2.5 pb-3"
              style={{ color: active ? "var(--admin-accent)" : "var(--admin-text-tertiary)" }}
            >
              <span className="w-[22px] h-[22px]">{item.icon}</span>
              <span className="text-[9.5px] font-semibold tracking-tight">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setSheet((s) => !s)}
          className="flex-1 flex flex-col items-center justify-center gap-1 pt-2.5 pb-3"
          style={{ color: sheet || plusActive ? "var(--admin-accent)" : "var(--admin-text-tertiary)" }}
          aria-label="Plus d'espaces"
        >
          <span className="w-[22px] h-[22px]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" className="w-full h-full">
              <circle cx="6" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="18" cy="12" r="1.4" />
            </svg>
          </span>
          <span className="text-[9.5px] font-semibold tracking-tight">Plus</span>
        </button>
      </nav>
    </>
  );
}
