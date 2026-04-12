/**
 * Generation de pages pilier (guides) par categorie via Claude Sonnet.
 * Chaque guide fait 1500-2500 mots avec table des matieres.
 */

import Anthropic from "@anthropic-ai/sdk";

let _anthropic: Anthropic | null = null;

function getClient() {
  if (!_anthropic) {
    _anthropic = new Anthropic();
  }
  return _anthropic;
}

export type GuideInput = {
  categoryName: string;
  categorySlug: string;
  vertical: string;
  departmentName: string;
  prosCount: number;
};

export type GuideOutput = {
  title: string;
  metaDescription: string;
  content: string;
  tableOfContents: { title: string; anchor: string }[];
};

export async function generateGuideContent(
  input: GuideInput
): Promise<GuideOutput> {
  const client = getClient();

  const prompt = `Tu es un redacteur expert pour Workwave, un annuaire de professionnels locaux en France.

Tu rediges en francais correct, avec tous les accents (a, e, e, e, c, u, etc.). Ne produis jamais de texte francais sans accents.

Redige un guide complet et expert sur le metier de "${input.categoryName}" pour notre annuaire. Ce guide sera la page pilier SEO principale pour cette categorie.

**Contexte :**
- Metier : ${input.categoryName}
- Vertical : ${input.vertical === "btp" ? "BTP et artisanat" : input.vertical === "domicile" ? "Services a domicile" : "Aide a la personne"}
- Zone : ${input.departmentName} (Nouvelle-Aquitaine)
- Nombre de professionnels references : ${input.prosCount}

**Structure obligatoire (8-10 sections H2) :**

## Qu'est-ce qu'un ${input.categoryName.toLowerCase()} ?

Definition precise du metier, perimetre d'intervention, difference avec les metiers proches. 150-200 mots.

## Les specialites d'un ${input.categoryName.toLowerCase()}

Liste des sous-specialites et domaines d'expertise. Detaille 4-6 specialites avec une phrase d'explication chacune. 200-250 mots.

## Quand faire appel a un ${input.categoryName.toLowerCase()} ?

Situations concretes ou l'on a besoin de ce professionnel. Liste 5-7 cas d'usage courants. 200-250 mots.

## Tarifs et prix moyens en 2026

Fourchettes de prix realistes pour 5-6 prestations courantes en Nouvelle-Aquitaine. Format : "Prestation : X a Y euros". Precise les facteurs qui influencent le prix. 250-300 mots.

## Comment bien choisir son ${input.categoryName.toLowerCase()} ?

5-6 criteres de selection concrets et actionnables. Mentionne les certifications pertinentes, les assurances obligatoires, l'importance des devis comparatifs. 200-250 mots.

## Certifications et labels a connaitre

Liste les certifications et labels pertinents pour ce metier (RGE, Qualibat, etc. selon le metier). Explique ce que chaque label garantit. 150-200 mots.

## Deroulement type d'un chantier

Etapes chronologiques d'une prestation type, du premier contact a la fin des travaux. 5-7 etapes detaillees. 200-250 mots.

## Les questions a poser avant de signer un devis

Checklist de 6-8 questions essentielles a poser au professionnel avant de s'engager. Format question + pourquoi c'est important. 200-250 mots.

## Vos droits en tant que client

Informations legales essentielles : garantie decennale, assurance RC, droit de retractation, recours en cas de litige. 150-200 mots.

## Trouver un ${input.categoryName.toLowerCase()} en ${input.departmentName}

Paragraphe de conclusion qui mentionne Workwave et le nombre de professionnels disponibles dans la zone. Encourage a utiliser l'annuaire pour comparer et contacter. 100-150 mots.

**Regles de redaction :**
- Ton expert mais accessible, ni familier ni trop academique
- Donnees chiffrees et concretes (prix, delais, surfaces)
- Pas d'emojis, pas de listes a puces sauf dans les checklists
- Pas de mention de marques ou entreprises specifiques
- Total : 1500-2500 mots
- Markdown avec H2 (##) et H3 (###) si besoin
- Pas de H1 (sera gere par la page)`;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const content =
    msg.content[0].type === "text" ? msg.content[0].text : "";

  // Extraire la table des matieres depuis les H2
  const toc: { title: string; anchor: string }[] = [];
  const h2Regex = /^## (.+)$/gm;
  let match;
  while ((match = h2Regex.exec(content)) !== null) {
    const title = match[1].trim();
    const anchor = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    toc.push({ title, anchor });
  }

  // Generer title + meta description
  const metaMsg = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Genere un title SEO (max 60 chars) et une meta description (max 155 chars) pour un guide complet sur le metier de "${input.categoryName}" en ${input.departmentName}.

Format de reponse (2 lignes, rien d'autre) :
Ligne 1 : le title
Ligne 2 : la meta description`,
      },
    ],
  });

  const metaText =
    metaMsg.content[0].type === "text" ? metaMsg.content[0].text : "";
  const metaLines = metaText.trim().split("\n").filter(Boolean);

  const title =
    metaLines[0]?.trim() ||
    `Guide ${input.categoryName} : tout savoir pour bien choisir`;
  const metaDescription =
    metaLines[1]?.trim() ||
    `Guide complet sur le metier de ${input.categoryName.toLowerCase()}. Prix, criteres de choix, certifications, droits. ${input.prosCount} professionnels en ${input.departmentName}.`;

  return {
    title,
    metaDescription,
    content,
    tableOfContents: toc,
  };
}
