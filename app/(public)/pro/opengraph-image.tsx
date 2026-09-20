import { ImageResponse } from "next/og";

// Image Open Graph dédiée à /pro : sans elle, le partage du lien (Instagram,
// WhatsApp...) n'affichait aucun visuel (le fichier OG racine n'est pas hérité
// par /pro, et le metadata openGraph de la page ne définissait pas d'images).
//
// 20/09/2026 : passée au thème verre, comme celle de l'accueil. Mêmes
// contraintes de générateur (pas de <br>, display flex partout, police par
// défaut) : voir le commentaire de app/opengraph-image.tsx.
export const runtime = "edge";
export const alt = "Workwave.fr Pro · Recevez des chantiers près de chez vous";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ENCRE = "#243036";
const ENCRE_DOUCE = "#7d929b";
const TEXTE = "#5c7078";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 70px",
          background: "linear-gradient(145deg, #f8fafb 0%, #eef3f3 52%, #e6eeee 100%)",
        }}
      >
        {/* Marque + mention « Pro » */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 58,
              height: 58,
              borderRadius: 17,
              marginRight: 18,
              background: "linear-gradient(135deg, #ef6426, #bd4214)",
              border: "1px solid #e89977",
              color: "#ffffff",
              fontSize: 31,
              fontWeight: 700,
              letterSpacing: "-1px",
            }}
          >
            W
          </div>
          <div style={{ display: "flex", fontSize: 31, fontWeight: 600, letterSpacing: "-1.2px" }}>
            <div style={{ color: ENCRE }}>Workwave</div>
            <div style={{ color: "#c44c1c", marginLeft: -7 }}>.fr</div>
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: 16,
              padding: "7px 16px",
              borderRadius: 999,
              background: "#e9f0ec",
              color: "#416959",
              fontSize: 19,
              fontWeight: 600,
              letterSpacing: "1px",
            }}
          >
            PRO
          </div>
        </div>

        {/* Une ligne par div : Satori ne gère pas <br> */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 74,
            fontWeight: 600,
            letterSpacing: "-3.5px",
            lineHeight: 1.06,
          }}
        >
          <div style={{ color: ENCRE }}>Recevez des chantiers</div>
          <div style={{ color: ENCRE }}>près de chez vous.</div>
          <div style={{ color: ENCRE_DOUCE }}>Sans abonnement.</div>
        </div>

        {/* Le modèle, en clair : c'est ce qui décide un artisan */}
        <div style={{ display: "flex", alignItems: "center", fontSize: 23, color: TEXTE }}>
          <div
            style={{
              display: "flex",
              width: 9,
              height: 9,
              borderRadius: 5,
              background: "#4a8a6c",
              marginRight: 14,
            }}
          />
          <div style={{ display: "flex" }}>Fiche gratuite</div>
          <div style={{ display: "flex", color: "#c2cfd3", margin: "0 14px" }}>·</div>
          <div style={{ display: "flex" }}>9,90 € par contact débloqué</div>
          <div style={{ display: "flex", color: "#c2cfd3", margin: "0 14px" }}>·</div>
          <div style={{ display: "flex" }}>0 % de commission</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
