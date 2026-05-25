/**
 * SectionLabel — indicateur de pagination + label uppercase + bullet orange.
 *
 * Pattern signature Workwave AI (style Pixel Rise). Utilise au debut de
 * chaque section sur /ai/*.
 *
 * Exemple :
 *   <SectionLabel index={2} total={5} label="Methode" />
 *   → [ 02 / 05 ] ── ● METHODE
 */
export function SectionLabel({
  index,
  total,
  label,
}: {
  index: number | string;
  total: number;
  label: string;
}) {
  const formattedIndex =
    typeof index === "number" ? String(index).padStart(2, "0") : index;
  const formattedTotal = String(total).padStart(2, "0");

  return (
    <div className="flex items-center gap-4 mb-6">
      <span
        className="text-[11px] font-medium tracking-[0.2em] text-[var(--ai-text-tertiary)]"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        [ {formattedIndex} / {formattedTotal} ]
      </span>
      <span className="h-px flex-1 max-w-[40px] bg-[var(--ai-border)]" />
      <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-text)]">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
        {label}
      </span>
    </div>
  );
}
