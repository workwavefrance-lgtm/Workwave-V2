import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Workwave — Trouvez un professionnel de confiance en Vienne";
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
          Plus de 20 000 professionnels en Vienne
        </div>
      </div>
    ),
    { ...size }
  );
}
