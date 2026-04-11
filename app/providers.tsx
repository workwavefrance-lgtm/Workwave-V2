"use client";

import { ThemeProvider } from "next-themes";
import CookieBanner from "@/components/layout/CookieBanner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <CookieBanner />
    </ThemeProvider>
  );
}
