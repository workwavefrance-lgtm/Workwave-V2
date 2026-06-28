import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAiProByUserId } from "@/lib/queries/pros";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";
import { getAvatarStyle, getInitials } from "@/lib/ai/personalisation";

const NAV_ITEMS = [
  { href: "/ai/dashboard", label: "Accueil", icon: "01" },
  { href: "/ai/dashboard/projets", label: "Tous les projets", icon: "02" },
  { href: "/ai/dashboard/profil", label: "Mon profil", icon: "03" },
  { href: "/ai/dashboard/preferences", label: "Preferences", icon: "04" },
  { href: "/ai/dashboard/abonnement", label: "Facturation", icon: "05" },
  { href: "/ai/dashboard/parametres", label: "Parametres", icon: "06" },
];

export default async function AiDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1) Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/ai/connexion");
  }

  // 2) Recuperer le pro associe
  const pro = await getAiProByUserId(user.id);

  if (!pro) {
    // User connecte sans fiche pros : redirige vers inscription
    redirect("/ai/inscription?error=no_profile");
  }

  // 3) Verifier que le pro est Workwave AI (14 categories AI_CATEGORY_IDS :
  // tech 43-48 + business/creatif 79-87). Sinon redirige vers le dashboard
  // BTP (l'user a une fiche BTP, pas AI).
  if (!AI_CATEGORY_IDS.includes(pro.category_id)) {
    redirect("/pro/dashboard");
  }

  // 4) Render dashboard shell
  const proName = pro.name || "Freelance";
  const initials = getInitials(proName);
  const avatarStyle = getAvatarStyle(pro.avatar_color);

  return (
    <div className="min-h-screen flex bg-[var(--ai-bg)]">
      {/* ════════════════════════════════════════════════════════════
          SIDEBAR DESKTOP (md+) — Pixel Rise style
          ════════════════════════════════════════════════════════════ */}
      <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 border-r border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)] sticky top-0 h-screen">
        {/* Logo */}
        <div className="p-6 border-b border-[var(--ai-border-subtle)]">
          <Link
            href="/ai"
            className="inline-flex items-center gap-2.5 group"
            aria-label="Workwave AI"
          >
            <div
              className="grid grid-cols-2 grid-rows-2 gap-[2px] w-8 h-8 transition-transform duration-200 group-hover:rotate-90"
              aria-hidden="true"
            >
              <div className="bg-[var(--ai-accent)] rounded-[2px]" />
              <div className="bg-[var(--ai-text)] rounded-[2px]" />
              <div className="bg-[var(--ai-text)] rounded-[2px]" />
              <div className="bg-[var(--ai-accent)] rounded-[2px]" />
            </div>
            <span className="text-[16px] font-semibold text-[var(--ai-text)] tracking-tight">
              Workwave{" "}
              <span className="font-medium text-[var(--ai-text-tertiary)]">
                AI
              </span>
            </span>
          </Link>
        </div>

        {/* Profile card */}
        <div className="p-6 border-b border-[var(--ai-border-subtle)]">
          <div className="flex items-center gap-3 mb-3">
            {pro.logo_url ? (
              <div
                className="w-10 h-10 rounded-full overflow-hidden bg-white border border-[var(--ai-border-subtle)]"
                aria-hidden="true"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pro.logo_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[15px]"
                style={avatarStyle}
                aria-hidden="true"
              >
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-[var(--ai-text)] truncate">
                {proName}
              </p>
              <p className="text-[12px] text-[var(--ai-text-tertiary)] truncate">
                {user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] uppercase font-semibold tracking-wider">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
            <span className="text-[var(--ai-accent)]">
              Pay-per-lead · 9,90 €/projet
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav
          className="flex-1 px-3 py-4 space-y-1"
          aria-label="Navigation dashboard"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium text-[var(--ai-text-secondary)] hover:bg-[var(--ai-bg-subtle)] hover:text-[var(--ai-text)] transition-colors"
            >
              <span
                className="text-[10px] font-bold text-[var(--ai-text-tertiary)] group-hover:text-[var(--ai-accent)] transition-colors"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div className="p-4 border-t border-[var(--ai-border-subtle)] space-y-2">
          <Link
            href="/ai/deposer"
            className="block text-[11px] text-[var(--ai-text-tertiary)] hover:text-[var(--ai-accent)] transition-colors"
          >
            → Voir le site public
          </Link>
          {/* Bug critique fix : prefetch={false} obligatoire sinon Next.js
              prefetch ce GET = signout silencieux quand le dashboard charge,
              et toute action suivante kicke l'user vers /ai/connexion. */}
          <Link
            href="/api/auth/signout?redirect=/ai"
            prefetch={false}
            className="block text-[11px] text-[var(--ai-text-tertiary)] hover:text-[var(--ai-accent)] transition-colors"
          >
            → Se deconnecter
          </Link>
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════
          MAIN CONTENT
          ════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header mobile (< md) */}
        <header className="md:hidden sticky top-0 z-40 bg-[var(--ai-bg)]/85 backdrop-blur-md border-b border-[var(--ai-border-subtle)]">
          <div className="px-4 h-16 flex items-center justify-between">
            <Link
              href="/ai"
              className="inline-flex items-center gap-2"
              aria-label="Workwave AI"
            >
              <div
                className="grid grid-cols-2 grid-rows-2 gap-[2px] w-7 h-7"
                aria-hidden="true"
              >
                <div className="bg-[var(--ai-accent)] rounded-[2px]" />
                <div className="bg-[var(--ai-text)] rounded-[2px]" />
                <div className="bg-[var(--ai-text)] rounded-[2px]" />
                <div className="bg-[var(--ai-accent)] rounded-[2px]" />
              </div>
              <span className="text-[14px] font-semibold text-[var(--ai-text)] tracking-tight">
                Workwave AI
              </span>
            </Link>
            {pro.logo_url ? (
              <div
                className="w-9 h-9 rounded-full overflow-hidden bg-white border border-[var(--ai-border-subtle)]"
                aria-hidden="true"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pro.logo_url} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-[14px]"
                style={avatarStyle}
                aria-hidden="true"
              >
                {initials}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-10 pb-24 md:pb-10">
          {children}
        </main>
      </div>

      {/* ════════════════════════════════════════════════════════════
          BOTTOM BAR MOBILE (< md)
          ════════════════════════════════════════════════════════════ */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--ai-bg-card)] border-t border-[var(--ai-border-subtle)]"
        aria-label="Navigation mobile"
      >
        <div className="flex justify-around items-stretch h-16">
          {NAV_ITEMS.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-[var(--ai-text-secondary)] hover:text-[var(--ai-text)] transition-colors active:bg-[var(--ai-bg-subtle)]"
            >
              <span
                className="text-[9px] font-bold text-[var(--ai-text-tertiary)]"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                {item.icon}
              </span>
              <span className="truncate px-1">
                {item.label.replace("Mon ", "").replace("Tous les projets", "Projets")}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
