import { ImageResponse } from "next/og";

export const runtime = "edge";
// Le texte de cette image de partage (et son alt) datait du lancement d'avril 2026,
// quand le site ne couvrait que le departement de la Vienne : il annoncait
// « Plus de 20 000 professionnels en Vienne ». Le site couvre aujourd'hui la France
// entiere et la Belgique francophone (107 departements et provinces, 35 163 communes,
// 1 233 038 fiches ouvertes au 03/09/2026). Formulation volontairement SANS CHIFFRE : le nombre de
// fiches bouge a chaque scrape, une image de partage ne se met pas a jour toute seule,
// et un chiffre perime ici se propage dans tous les partages sociaux et les apercus de
// lien. Le libelle de couverture repris est celui deja utilise dans app/layout.tsx.
export const alt =
  "Workwave · Trouvez un professionnel de confiance partout en France et en Belgique francophone";
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
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#FAFAFA",
            letterSpacing: "-2px",
            marginBottom: "16px",
          }}
        >
          Workwave
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#9CA3AF",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.4,
          }}
        >
          Trouvez un professionnel de confiance
        </div>
        <div
          style={{
            fontSize: 20,
            color: "#FF5A36",
            marginTop: "24px",
            fontWeight: 600,
          }}
        >
          Partout en France et en Belgique francophone
        </div>
      </div>
    ),
    { ...size }
  );
}
