"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, ArrowUpRight } from "lucide-react";
import { useAdmin } from "@/components/admin/shell/AdminProvider";
import { ADMIN_NAV, isNavActive } from "./nav-config";

const MAIN = new Set(["home", "projects", "support", "statistiques", "alerts"]);

export default function AdminSidebar() {
  const pathname = usePathname();
  const { admin, sidebarCollapsed, setSidebarCollapsed } = useAdmin();
  return <aside className={`admin-sidebar hidden lg:flex flex-col ${sidebarCollapsed ? "w-[76px]" : "w-[240px]"}`}>
    <div className="flex items-center gap-2 px-2 mb-8 min-h-9">
      {!sidebarCollapsed && <Link href="/admin" className="admin-brand">workwave<span>.</span>fr</Link>}
      <button type="button" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        aria-label={sidebarCollapsed ? "Développer la navigation" : "Réduire la navigation"}
        aria-expanded={!sidebarCollapsed} className="ml-auto p-1.5 rounded-lg text-[var(--admin-text-tertiary)] hover:bg-[var(--admin-hover)]">
        {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </button>
    </div>
    {!sidebarCollapsed && <p className="px-3 mb-5 text-xs text-[var(--admin-text-secondary)]">Votre espace de pilotage</p>}
    <nav className="flex-1 min-h-0 overflow-y-auto" aria-label="Navigation principale">
      {[{ name: "L’essentiel", items: ADMIN_NAV.filter(i => MAIN.has(i.key)) },
        { name: "Gestion", items: ADMIN_NAV.filter(i => !MAIN.has(i.key)) }].map(group => <div key={group.name} className="mb-5">
        {!sidebarCollapsed && <p className="admin-eyebrow px-3 !text-[9px] !mb-2">{group.name}</p>}
        {group.items.map(item => <Link key={item.key} href={item.href} prefetch={false}
          className={`admin-nav-link ${sidebarCollapsed ? "justify-center" : ""}`}
          aria-current={isNavActive(item, pathname) ? "page" : undefined}
          aria-label={item.label} title={sidebarCollapsed ? item.label : undefined}>
          <span className="w-[18px] h-[18px] shrink-0">{item.icon}</span>{!sidebarCollapsed && item.label}
        </Link>)}
      </div>)}
    </nav>
    <div className="pt-4 border-t border-[var(--admin-border)] px-2">
      {!sidebarCollapsed && <Link href="/" target="_blank" rel="noopener noreferrer" className="flex justify-between text-xs text-[var(--admin-text-secondary)] mb-5">Voir le site <ArrowUpRight size={14} /></Link>}
      <div className="flex gap-2 items-center"><span className="w-8 h-8 rounded-full grid place-items-center bg-white text-xs shrink-0">{admin.email.charAt(0).toUpperCase()}</span>
        {!sidebarCollapsed && <div className="min-w-0"><p className="truncate text-[11px]">{admin.email}</p><p className="text-[10px] text-[var(--admin-text-tertiary)]">{admin.role}</p></div>}
      </div>
    </div>
  </aside>;
}
