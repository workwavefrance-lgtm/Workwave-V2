"use client";

import { ThemeProvider } from "next-themes";
import CookieBanner from "@/components/layout/CookieBanner";
import IncidentBanner from "@/components/layout/IncidentBanner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {/* Bandeau d'excuses de l'incident du 04/08 : en TETE de page (le bandeau
          cookies occupe deja le bas de l'ecran) et auto-expirant — cf. le fichier. */}
      <IncidentBanner />
      {children}
      <CookieBanner />
    </ThemeProvider>
  );
}
