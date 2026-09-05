import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const KEY = process.env.PERPLEXITY_API_KEY!;
const prompt = `Recherche des donnees CHIFFREES et SOURCEES sur le volume de recherche mensuel en France (Google) pour les requetes suivantes, tapees par des ARTISANS du batiment qui cherchent du travail :
"trouver des chantiers", "trouver des chantiers gratuitement", "plateforme pour trouver des chantiers", "trouver des clients artisan", "apport de chantiers", "trouver des chantiers plombier / electricien / macon / peintre".
Donne pour chaque requete un volume mensuel estime si une source publique le cite (outil SEO, article, etude), et dis explicitement "inconnu" si aucune source ne le donne. Donne aussi le nombre d'artisans du batiment en France (source officielle CAPEB/FFB/INSEE avec annee) et le nombre de professionnels inscrits sur Travaux.com et Habitatpresto si publie. Ne devine JAMAIS un chiffre : soit tu cites une source, soit tu ecris inconnu.`;
(async () => {
  const r = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "sonar", messages: [{ role: "user", content: prompt }] }),
  });
  const j: any = await r.json();
  console.log((j.choices?.[0]?.message?.content || JSON.stringify(j)).replace(/\[\d+\]/g, ""));
  console.log("\n--- SOURCES ---");
  for (const s of (j.search_results || j.citations || [])) console.log(typeof s === "string" ? s : `${s.title} :: ${s.url}`);
})();
