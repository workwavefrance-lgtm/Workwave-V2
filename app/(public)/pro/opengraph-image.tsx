import { ImageResponse } from "next/og";

// Image Open Graph dédiée à /pro : sans elle, le partage du lien (Instagram,
// WhatsApp...) n'affichait aucun visuel (le fichier OG racine n'est pas hérité
// par /pro, et le metadata openGraph de la page ne définissait pas d'images).
export const runtime = "edge";
export const alt = "Workwave Pro — Recevez des chantiers près de chez vous";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0A0A0A",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "70px",
        }}
      >
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: "#FF5A36",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}
        >
          Workwave Pro
        </div>
        <div
          style={{
            fontSize: 68,
            fontWeight: 800,
            color: "#FAFAFA",
            letterSpacing: "-2px",
            lineHeight: 1.1,
            maxWidth: "1000px",
          }}
        >
          Recevez des chantiers près de chez vous
        </div>
        <div
          style={{
            fontSize: 30,
            color: "#9CA3AF",
            marginTop: "28px",
            lineHeight: 1.4,
            maxWidth: "950px",
          }}
        >
          Fiche gratuite · Sans abonnement · 9,90 € par lead que vous voulez
          contacter
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: "48px",
          }}
        >
          <div
            style={{
              background: "#FF5A36",
              color: "#FFFFFF",
              fontSize: 24,
              fontWeight: 700,
              padding: "14px 32px",
              borderRadius: "9999px",
            }}
          >
            workwave.fr/pro
          </div>
          <div style={{ fontSize: 24, color: "#6B7280" }}>
            0 % de commission
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
