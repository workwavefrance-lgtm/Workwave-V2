export function truncateDescription(
  text: string | null | undefined,
  maxLength: number = 155
): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trimEnd() + "...";
}
