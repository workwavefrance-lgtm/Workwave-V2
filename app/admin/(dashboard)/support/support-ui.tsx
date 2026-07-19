"use client";

import { useEffect, useState } from "react";

export type TicketStatus = "open" | "pending" | "resolved" | "closed";

export const STATUS_META: Record<
  TicketStatus,
  { label: string; variant: "info" | "warning" | "success" | "default" }
> = {
  open: { label: "Ouvert", variant: "info" },
  pending: { label: "En attente", variant: "warning" },
  resolved: { label: "Résolu", variant: "success" },
  closed: { label: "Fermé", variant: "default" },
};

export const STATUS_TABS: { value: string; label: string }[] = [
  { value: "open", label: "Ouverts" },
  { value: "pending", label: "En attente" },
  { value: "resolved", label: "Résolus" },
  { value: "closed", label: "Fermés" },
  { value: "all", label: "Tous" },
];

export const SOURCE_LABEL: Record<string, string> = {
  email: "Email",
  chat: "Chat",
  form: "Formulaire",
  admin: "Admin",
};

export const CATEGORY_LABEL: Record<string, string> = {
  rgpd: "RGPD",
  unlock: "Déblocage",
  claim: "Réclamation",
  facturation: "Facturation",
  projet: "Projet",
  autre: "Autre",
};

export function relativeTime(iso: string): string {
  const d = new Date(iso).getTime();
  const s = Math.max(0, Math.floor((Date.now() - d) / 1000));
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  if (j < 30) return `il y a ${j} j`;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Temps relatif rendu APRÈS montage uniquement -> aucun mismatch d'hydratation
 * (le serveur et le client afficheraient sinon des valeurs différentes).
 */
export function TimeAgo({ iso }: { iso: string }) {
  const [txt, setTxt] = useState("");
  useEffect(() => {
    setTxt(relativeTime(iso));
  }, [iso]);
  return <span suppressHydrationWarning>{txt || "—"}</span>;
}
