"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "./DashboardProvider";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { createClient } from "@/lib/supabase/client";

export default function DashboardHeader() {
  const { pro, user } = useDashboard();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const initial = pro.name.charAt(0).toUpperCase();

  // Fermer le menu au clic extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="h-16 border-b border-[var(--border-color)] bg-[var(--bg-primary)] px-6 flex items-center justify-between shrink-0">
      {/* Logo mobile */}
      <div className="lg:hidden">
        <span className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
          Workwave
        </span>
      </div>

      {/* Espace vide desktop (le titre de page pourra être ajouté ici en Phase 4) */}
      <div className="hidden lg:block" />

      {/* Actions */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* Menu utilisateur */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors duration-250"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--accent-muted)] flex items-center justify-center">
              <span className="text-[var(--accent)] font-bold text-xs">{initial}</span>
            </div>
            <span className="hidden sm:block text-sm font-medium text-[var(--text-primary)] max-w-[120px] truncate">
              {pro.name}
            </span>
            <svg className="w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {/* Dropdown */}
          {showMenu && (
            <div className="absolute right-0 top-12 w-56 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-lg z-50 py-1">
              <div className="px-4 py-3 border-b border-[var(--border-color)]">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{pro.name}</p>
                <p className="text-xs text-[var(--text-tertiary)] truncate">{user.email}</p>
              </div>

              <a
                href={`/artisan/${pro.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors duration-250"
                onClick={() => setShowMenu(false)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Voir ma fiche publique
              </a>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-[var(--bg-tertiary)] transition-colors duration-250"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
