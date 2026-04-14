"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function checkProStatus(userId: string | undefined) {
      if (!userId) {
        setIsPro(false);
        return;
      }
      const { data } = await supabase
        .from("pros")
        .select("id")
        .eq("claimed_by_user_id", userId)
        .is("deleted_at", null)
        .eq("is_active", true)
        .maybeSingle();
      setIsPro(!!data);
    }

    // Verifier la session sans requete DB pour les anonymes
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        checkProStatus(session.user.id);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id) {
        checkProStatus(session.user.id);
      } else {
        setIsPro(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-lg border-b border-[var(--border-color)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-[72px] flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-[var(--text-primary)]"
        >
          Workwave
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <Link
            href="/"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] link-underline transition-colors duration-250"
          >
            Accueil
          </Link>
          <Link
            href="/recherche"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] link-underline transition-colors duration-250"
          >
            Rechercher
          </Link>
          <Link
            href="/deposer-projet"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] link-underline transition-colors duration-250"
          >
            Déposer un projet
          </Link>
          <Link
            href="/blog"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] link-underline transition-colors duration-250"
          >
            Blog
          </Link>
          <Link
            href="/pro"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] link-underline transition-colors duration-250"
          >
            Pro
          </Link>
        </nav>

        {/* Actions desktop */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Link
            href={isPro ? "/pro/dashboard" : "/pro/connexion"}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] link-underline transition-colors duration-250"
          >
            {isPro ? "Mon dashboard" : "Espace Pro"}
          </Link>
          <Link
            href="/recherche"
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02]"
          >
            Trouver un pro
          </Link>
        </div>

        {/* Mobile: ThemeToggle + Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--bg-secondary)] transition-colors duration-250"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              className="w-5 h-5"
            >
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-[var(--border-color)] bg-[var(--bg-primary)] px-4 pb-6 pt-4 space-y-1">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="block py-3 text-[var(--text-primary)] font-medium"
          >
            Accueil
          </Link>
          <Link
            href="/recherche"
            onClick={() => setMenuOpen(false)}
            className="block py-3 text-[var(--text-primary)] font-medium"
          >
            Rechercher
          </Link>
          <Link
            href="/deposer-projet"
            onClick={() => setMenuOpen(false)}
            className="block py-3 text-[var(--text-primary)] font-medium"
          >
            Déposer un projet
          </Link>
          <Link
            href="/blog"
            onClick={() => setMenuOpen(false)}
            className="block py-3 text-[var(--text-primary)] font-medium"
          >
            Blog
          </Link>
          <Link
            href="/pro"
            onClick={() => setMenuOpen(false)}
            className="block py-3 text-[var(--text-primary)] font-medium"
          >
            Pro
          </Link>
          <Link
            href={isPro ? "/pro/dashboard" : "/pro/connexion"}
            onClick={() => setMenuOpen(false)}
            className="block py-3 text-[var(--text-primary)] font-medium"
          >
            {isPro ? "Mon dashboard" : "Espace Pro"}
          </Link>
          <Link
            href="/recherche"
            onClick={() => setMenuOpen(false)}
            className="block mt-4 bg-[var(--accent)] text-white text-center px-5 py-3 rounded-full text-sm font-semibold"
          >
            Trouver un pro
          </Link>
        </nav>
      )}
    </header>
  );
}
