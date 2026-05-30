import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAiProByUserId } from "@/lib/queries/pros";
import { isAiPremium, AI_CATEGORY_IDS } from "@/lib/ai/helpers";
import { getAvatarStyle, getInitials } from "@/lib/ai/personalisation";

/**
 * Layout ANGLAIS du dashboard freelance Workwave AI (routes
 * /en/ai/dashboard/*). Miroir EXACT de app/(ai)/ai/dashboard/layout.tsx :
 *   - meme gating auth (getUser -> /en/ai/connexion ; getAiProByUserId ->
 *     /en/ai/inscription?error=no_profile ; !AI_CATEGORY_IDS -> /pro/dashboard)
 *   - sidebar EN, dashboard FREE-ONLY (pas d'UI Stripe premium)
 *   - lien deconnexion <Link prefetch={false}> obligatoire (sinon Next.js
 *     prefetch ce GET = signout silencieux au chargement). redirect=/en/ai.
 */

const NAV_ITEMS = [
  { href: "/en/ai/dashboard", label: "Home", icon: "01" },
  { href: "/en/ai/dashboard/projets", label: "Projects", icon: "02" },
  { href: "/en/ai/dashboard/profil", label: "My profile", icon: "03" },
  { href: "/en/ai/dashboard/preferences", label: "Preferences", icon: "04" },
  { href: "/en/ai/dashboard/abonnement", label: "Membership", icon: "05" },
  { href: "/en/ai/dashboard/parametres", label: "Settings", icon: "06" },
];

export default async function AiEnDashboardLayout({
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
    redirect("/en/ai/connexion");
  }

  // 2) Recuperer le pro associe
  const pro = await getAiProByUserId(user.id);

  if (!pro) {
    // User connecte sans fiche pros : redirige vers inscription EN
    redirect("/en/ai/inscription?error=no_profile");
  }

  // 3) Verifier que le pro est Workwave AI (14 categories AI_CATEGORY_IDS).
  // Sinon redirige vers le dashboard BTP (l'user a une fiche BTP, pas AI).
  if (!AI_CATEGORY_IDS.includes(pro.category_id)) {
    redirect("/pro/dashboard");
  }

  // 4) Render dashboard shell
  const proName = pro.name || "Freelancer";
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
            href="/en/ai"
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
              {isAiPremium(pro)
                ? pro.subscription_status === "trialing"
                  ? "Free trial"
                  : "Premium active"
                : "Free plan"}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav
          className="flex-1 px-3 py-4 space-y-1"
          aria-label="Dashboard navigation"
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
            href="/en/ai/deposer"
            className="block text-[11px] text-[var(--ai-text-tertiary)] hover:text-[var(--ai-accent)] transition-colors"
          >
            → View public site
          </Link>
          {/* Critical bug fix : prefetch={false} mandatory, otherwise Next.js
              prefetches this GET = silent signout when the dashboard loads,
              and any subsequent action kicks the user to /en/ai/connexion. */}
          <Link
            href="/api/auth/signout?redirect=/en/ai"
            prefetch={false}
            className="block text-[11px] text-[var(--ai-text-tertiary)] hover:text-[var(--ai-accent)] transition-colors"
          >
            → Sign out
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
              href="/en/ai"
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
        aria-label="Mobile navigation"
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
                {item.label.replace("My ", "")}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
