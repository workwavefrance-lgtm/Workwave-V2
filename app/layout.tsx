import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/app/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://workwave.fr"),
  title: {
    default: "Workwave — Trouvez un professionnel de confiance",
    template: "%s | Workwave",
  },
  description:
    "Annuaire des professionnels de la Vienne. Trouvez un plombier, électricien, peintre et plus de 35 métiers près de chez vous.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Workwave",
    title: "Workwave — Trouvez un professionnel de confiance",
    description:
      "Plus de 20 000 professionnels dans la Vienne. BTP, services a domicile, aide a la personne. Comparez et contactez gratuitement.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Workwave — Trouvez un professionnel de confiance",
    description:
      "Plus de 20 000 professionnels dans la Vienne. Comparez et contactez gratuitement.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-white text-[#0A0A0A] dark:bg-[#0A0A0A] dark:text-[#FAFAFA] transition-colors duration-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
