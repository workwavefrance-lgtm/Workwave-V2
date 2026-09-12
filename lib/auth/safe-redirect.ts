/** Normalise la destination avant de vérifier son origine, y compris // et \\. */
export function sameOriginRedirect(
  destination: string | null | undefined,
  baseUrl: string,
  fallbackPath = "/",
): URL {
  const origin = new URL(baseUrl).origin;
  const fallback = new URL(fallbackPath, origin);
  if (fallback.origin !== origin) throw new Error("Le repli doit rester sur la même origine.");
  try {
    const candidate = new URL(destination || fallbackPath, origin);
    if (candidate.origin === origin && !candidate.username && !candidate.password) {
      return candidate;
    }
  } catch {
    // Une URL malformée utilise le même repli qu'une destination extérieure.
  }
  return fallback;
}

/** Littéral JSON utilisable dans un script HTML sans pouvoir fermer sa balise. */
export function inlineScriptString(value: string): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) =>
    "\\u" + character.charCodeAt(0).toString(16).padStart(4, "0"),
  );
}
