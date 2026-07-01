import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Providers from "@/app/providers";
import UETPixel from "@/components/analytics/UETPixel";
import "./globals.css";

const GTM_ID = "GTM-W65L4PJD";

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
    default: "Workwave — Trouvez un artisan & recevez des devis gratuits",
    template: "%s | Workwave",
  },
  description:
    "Décrivez votre projet et recevez gratuitement des devis d'artisans de confiance près de chez vous : plombier, électricien, peintre et plus de 50 métiers, partout en France. Sans engagement.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Workwave",
    title: "Workwave — Trouvez un artisan & recevez des devis gratuits",
    description:
      "Décrivez votre projet, recevez des devis gratuits d'artisans près de chez vous. BTP, services à domicile, aide à la personne — partout en France, sans engagement.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Workwave — Trouvez un artisan & recevez des devis gratuits",
    description:
      "Décrivez votre projet, recevez des devis gratuits d'artisans près de chez vous. Partout en France, sans engagement.",
  },
  // Nom affiché si le site est ajouté à l'écran d'accueil iOS.
  appleWebApp: { title: "Workwave" },
};

// themeColor = couleur de la barre d'adresse mobile : on suit le fond réel du
// site (blanc en clair, noir en sombre) plutôt que le coral (réservé aux
// accents, cf. philosophie de design). Le coral reste la couleur du favicon +
// du theme_color PWA (manifest.ts).
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
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
      <head>
        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
        {/* End Google Tag Manager */}
      </head>
      <body className="min-h-full flex flex-col bg-white text-[#0A0A0A] dark:bg-[#0A0A0A] dark:text-[#FAFAFA] transition-colors duration-300">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {/* Microsoft Advertising UET pixel — track conversions /deposer-projet/merci.
            S'active si NEXT_PUBLIC_UET_TAG_ID est défini en env. Sinon : skip silencieux. */}
        <UETPixel />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
