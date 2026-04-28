import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Providers from "@/app/providers";
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
    default: "Workwave — Trouvez un professionnel de confiance",
    template: "%s | Workwave",
  },
  description:
    "Annuaire des professionnels de Nouvelle-Aquitaine. Trouvez un plombier, électricien, peintre et plus de 35 métiers près de chez vous.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Workwave",
    title: "Workwave — Trouvez un professionnel de confiance",
    description:
      "Plus de 226 000 professionnels en Nouvelle-Aquitaine. BTP, services à domicile, aide à la personne. Comparez et contactez gratuitement.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Workwave — Trouvez un professionnel de confiance",
    description:
      "Plus de 226 000 professionnels en Nouvelle-Aquitaine. Comparez et contactez gratuitement.",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
