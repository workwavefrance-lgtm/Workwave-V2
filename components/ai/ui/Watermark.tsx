/**
 * Watermark — texte geant en fond d'une section (style Pixel Rise).
 *
 * Utilise dans les heros pour creer une signature visuelle. Position
 * absolue, opacite tres basse via --ai-text-watermark.
 *
 * Exemple :
 *   <Watermark text="WORKWAVE.AI" position="bottom" />
 *   <Watermark text="PRICING" position="top" />
 *
 * Le parent doit avoir position: relative + overflow-hidden.
 */
export function Watermark({
  text,
  position = "bottom",
}: {
  text: string;
  position?: "top" | "bottom";
}) {
  const positionClass = position === "bottom" ? "bottom-0" : "top-0";
  const transform =
    position === "bottom" ? "translateY(15%)" : "translateY(-15%)";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none absolute inset-x-0 ${positionClass} z-0 overflow-hidden`}
    >
      <span
        className="block font-black uppercase whitespace-nowrap leading-none tracking-[-0.05em]"
        style={{
          fontSize: "clamp(80px, 17vw, 260px)",
          color: "var(--ai-text-watermark)",
          transform,
        }}
      >
        {text}
      </span>
    </div>
  );
}
