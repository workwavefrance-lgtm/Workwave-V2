import Anthropic from "@anthropic-ai/sdk";

let _anthropic: Anthropic | null = null;
function getClient() {
  if (!_anthropic) {
    _anthropic = new Anthropic();
  }
  return _anthropic;
}

type SeoInput = {
  categoryName: string;
  categorySlug: string;
  locationName: string;
  locationSlug: string;
  locationType: "city" | "department";
  departmentName?: string;
  departmentCode?: string;
  population?: number | null;
  prosCount: number;
};

type SeoOutput = {
  title: string;
  metaDescription: string;
  content: string;
};

export async function generateSeoContent(input: SeoInput): Promise<SeoOutput> {
  const locationContext =
    input.locationType === "city"
      ? `la ville de ${input.locationName} (${input.departmentName}, ${input.departmentCode}), qui compte environ ${input.population ? input.population.toLocaleString("fr-FR") : "quelques milliers d'"} habitants`
      : `le département ${input.locationName} (${input.departmentCode})`;

  const prompt = `Tu es un rédacteur SEO expert pour Workwave, un annuaire de professionnels locaux en France.

Tu rédiges en français correct, avec tous les accents (à, é, è, ê, ç, ù, etc.). Ne produis jamais de texte français sans accents, y compris dans les titres et sous-titres.

Rédige le contenu SEO pour la page "${input.categoryName} à ${input.locationName}" de notre annuaire. Ce contenu apparaît sous la liste des professionnels pour enrichir la page.

**Contexte :**
- Métier : ${input.categoryName}
- Localisation : ${locationContext}
- Nombre de professionnels référencés : ${input.prosCount}

**Structure obligatoire (utilise ces titres markdown exacts) :**

## ${input.categoryName} à ${input.locationName} : trouvez le bon professionnel

Un paragraphe d'introduction de 3-4 phrases qui mentionne ${input.locationName}, le métier, et pourquoi faire appel à un professionnel qualifié. Décris la ville uniquement par son statut général (préfecture, sous-préfecture, commune rurale) et sa taille approximative si pertinent.

## Prix moyens d'un ${input.categoryName.toLowerCase()} à ${input.locationName}

Un paragraphe avec des fourchettes de prix réalistes pour les prestations courantes de ce métier dans cette zone. Présente 3-4 types de prestations avec leur fourchette (ex: "Dépannage d'urgence : 80 à 150 euros"). Précise que les prix sont indicatifs et varient selon la complexité.

## Comment choisir son ${input.categoryName.toLowerCase()} à ${input.locationName}

Un paragraphe de 3-4 conseils concrets et actionnables pour bien choisir un professionnel de ce métier dans cette zone. Mentionne les certifications pertinentes, les assurances, les devis comparatifs.

## Questions fréquentes

5 questions-réponses pertinentes sous cette forme exacte :

### [Question] ?

[Réponse en 2-3 phrases]

**Règles de rédaction :**
- Ton premium mais accessible, ni familier ni trop formel
- Français naturel et fluide, pas de tournures robotiques
- Chaque page doit être unique : adapte le contenu à la ville/zone spécifique
- Fourchettes de prix réalistes pour la région Nouvelle-Aquitaine
- Entre 400 et 600 mots au total
- Pas d'emoji, pas de bullet points avec tirets (utilise des phrases complètes)
- Ne mentionne pas Workwave dans le contenu
- Ne commence pas par "Bienvenue" ou "Découvrez"
- INTERDIT : ne cite aucun quartier, monument, école, lieu-dit, rue, ou spécificité géographique de la ville. Ne cite aucun nom de lieu local. L'unicité du contenu doit venir des prix, des conseils métier, et de la FAQ, jamais de la géographie urbaine. Si tu n'es pas certain à 100% d'un fait local, ne l'écris pas.`;

  const message = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const content =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Générer title et meta_description
  const titlePrompt = `Pour la page "${input.categoryName} à ${input.locationName}" d'un annuaire de professionnels, génère UNIQUEMENT sur deux lignes séparées :
Ligne 1 : un title SEO optimisé de max 60 caractères (format : "${input.categoryName} à ${input.locationName} — X professionnels disponibles", remplace X par ${input.prosCount})
Ligne 2 : une meta description SEO de 130 à 155 caractères MAXIMUM. La phrase DOIT être complète et se terminer par un point. Compte les caractères avant de répondre. Ne dépasse jamais 155 caractères.

Écris en français correct avec tous les accents (à, é, è, ê, ç, ù). Pas de préfixe, pas de guillemets, juste les deux lignes.`;

  const metaMessage = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 200,
    messages: [{ role: "user", content: titlePrompt }],
  });

  const metaText =
    metaMessage.content[0].type === "text" ? metaMessage.content[0].text : "";
  const metaLines = metaText.trim().split("\n").filter(Boolean);

  const title =
    metaLines[0]?.trim() ||
    `${input.categoryName} à ${input.locationName} — ${input.prosCount} professionnels`;
  const metaDescription =
    metaLines[1]?.trim() ||
    `Trouvez un ${input.categoryName.toLowerCase()} à ${input.locationName}. ${input.prosCount} professionnels référencés.`;

  return {
    title,
    metaDescription,
    content,
  };
}
