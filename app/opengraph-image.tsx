import { ImageResponse } from "next/og";

export const runtime = "edge";
// Image de partage de l'accueil (WhatsApp, SMS, Messenger, LinkedIn...).
//
// 20/09/2026 : refonte au theme verre. L'image datait de l'ancienne charte,
// fond noir #0A0A0A et accent #FF5A36, alors que le site est clair depuis la
// refonte du 19/09 ; la marque s'ecrivait « Workwave » sans le .fr. Proposition
// validee par Willy (« verre plein cadre ») : la phrase de l'accueil en grand,
// lisible a la taille d'une vignette de conversation, ce qui est la seule
// taille qui compte vraiment pour un apercu de lien.
//
// Formulation SANS CHIFFRE, regle conservee depuis avril : le nombre de fiches
// bouge a chaque scrape, une image de partage ne se met pas a jour toute seule,
// et un chiffre perime se propage dans tous les partages.
//
// Contraintes du generateur (Satori) : pas de backdrop-filter, pas de <br>,
// tout element a plusieurs enfants doit etre en display flex. La police du site
// (Geist) n'est servie qu'en woff2 par next/font, que Satori ne lit pas : on
// reste sur la police par defaut plutot que d'embarquer un fichier de police et
// de changer le mode d'execution de la route.
export const alt =
  "Workwave.fr · Votre projet, le bon pro, tout simplement. Gratuit pour les particuliers, en France et en Belgique francophone";
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
        {/* Marque */}
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
        </div>

        {/* La phrase de l'accueil, une ligne par div : Satori ne gere pas <br> */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 82,
            fontWeight: 600,
            letterSpacing: "-4px",
            lineHeight: 1.05,
          }}
        >
          <div style={{ color: ENCRE }}>Votre projet.</div>
          <div style={{ color: ENCRE }}>Le bon pro.</div>
          <div style={{ color: ENCRE_DOUCE }}>Tout simplement.</div>
        </div>

        {/* Les deux faits qui levent l'hesitation avant meme le clic */}
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
          <div style={{ display: "flex" }}>Gratuit pour les particuliers</div>
          <div style={{ display: "flex", color: "#c2cfd3", margin: "0 14px" }}>·</div>
          <div style={{ display: "flex" }}>France et Belgique francophone</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
