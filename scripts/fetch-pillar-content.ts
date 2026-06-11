/**
 * Sourcing Perplexity des pages pilier suivantes (déclinaison du moule
 * /serrurier/urgence validé le 10/06) : chauffagiste (dépannage urgence),
 * ramoneur (ramonage obligatoire), climaticien (pose de clim).
 *
 * APPEND dans lib/data/urgence-content.ts (même shape UrgenceContent pour
 * tous — le champ `majorations` porte la note de contexte propre au métier).
 * Idempotent : si la clé existe déjà dans le fichier, le métier est sauté.
 *
 * Usage : npx tsx scripts/fetch-pillar-content.ts
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const KEY = process.env.PERPLEXITY_API_KEY;
if (!KEY) {
  console.error("❌ PERPLEXITY_API_KEY manquante");
  process.exit(1);
}
const YEAR = new Date().getFullYear();
const DEST = path.resolve(process.cwd(), "lib/data/urgence-content.ts");

const JSON_SHAPE = `{
  "priceRanges": [ { "label": "<prestation précise>", "low": <nombre>, "high": <nombre> } ],  // 4 fourchettes
  "majorations": "<phrase factuelle de contexte (voir consigne du métier)>",
  "legalFacts": ["<3 à 5 faits RÉGLEMENTAIRES exacts et vérifiables>"],
  "scamWarnings": ["<4 à 6 pratiques abusives/arnaques DOCUMENTÉES du secteur>"],
  "goodReflexes": ["<4 à 6 bons réflexes concrets pour le particulier>"]
}`;

const PROMPTS: Record<string, string> = {
  chauffagiste: `Tu es un expert du dépannage chauffage en France. Recherche les données RÉELLES ${YEAR} (ou les plus récentes) sur le DÉPANNAGE CHAUFFAGE/CHAUDIÈRE EN URGENCE en France et renvoie UNIQUEMENT ce JSON strict : ${JSON_SHAPE}
priceRanges attendus : dépannage chaudière (déplacement + main d'œuvre), tarif horaire chauffagiste, entretien annuel chaudière, remplacement pièce courante (ex. circulateur ou thermostat). majorations = phrase sur les majorations soir/week-end/jours fériés constatées. legalFacts : entretien annuel obligatoire de la chaudière (décret), devis obligatoire dépannage à domicile (arrêté 24/01/2017), attestation d'entretien, recours SignalConso/DGCCRF. Contraintes : chiffres sourcés uniquement, pas de promesse de délai, France métropolitaine.`,

  ramoneur: `Tu es un expert du ramonage en France. Recherche les données RÉELLES ${YEAR} (ou les plus récentes) sur le RAMONAGE OBLIGATOIRE en France et renvoie UNIQUEMENT ce JSON strict : ${JSON_SHAPE}
priceRanges attendus : ramonage cheminée bois (conduit simple), ramonage poêle à bois, ramonage poêle à granulés, ramonage chaudière gaz/fioul. majorations = phrase sur la HAUTE SAISON (septembre-décembre : délais d'attente, conseils de réserver au printemps/été si constaté). legalFacts : obligation légale du ramonage (décret 2023-641 du 20 juillet 2023 et/ou règlement sanitaire départemental, fréquence 1 à 2 fois/an selon combustible), certificat de ramonage et son rôle vis-à-vis de l'ASSURANCE habitation en cas d'incendie, qualification exigée du professionnel, amende encourue. scamWarnings : démarchage téléphonique/porte-à-porte de faux ramoneurs (phénomène documenté), prix d'appel très bas puis suppléments, faux certificats, pression à remplacer des pièces. Contraintes : chiffres sourcés uniquement, France métropolitaine.`,

  climaticien: `Tu es un expert de la climatisation en France. Recherche les données RÉELLES ${YEAR} (ou les plus récentes) sur la POSE/INSTALLATION DE CLIMATISATION en France et renvoie UNIQUEMENT ce JSON strict : ${JSON_SHAPE}
priceRanges attendus : pose clim monosplit (matériel + pose), pose clim multisplit, clim gainable, entretien annuel climatisation. majorations = phrase sur la haute saison (été/canicule : délais, conseil d'anticiper au printemps si constaté). legalFacts : attestation de capacité fluides frigorigènes OBLIGATOIRE pour manipuler le circuit (interdiction de pose complète en autoinstallation), entretien obligatoire selon puissance (inspection étanchéité), règles de copropriété/autorisation pour l'unité extérieure, état des AIDES réelles (la clim air-air réversible est-elle éligible à MaPrimeRénov ? réponse exacte sourcée — ne rien inventer). scamWarnings : pratiques abusives documentées du secteur (démarchage, sous-dimensionnement, absence d'attestation fluides, devis gonflés). Contraintes : chiffres sourcés uniquement, France métropolitaine.`,

  menage: `Tu es un expert du ménage de locations saisonnières (Airbnb, gîtes, résidences secondaires) en France. Recherche les données RÉELLES ${YEAR} (ou les plus récentes) sur le MÉNAGE DE LOCATION SAISONNIÈRE en France et renvoie UNIQUEMENT ce JSON strict : ${JSON_SHAPE}
priceRanges attendus : ménage de fin de séjour type studio/T2 (forfait), ménage maison/villa (forfait), tarif horaire d'une entreprise de ménage, blanchisserie/linge par lit (si sourcé, sinon une 4e prestation sourcée pertinente). majorations = phrase factuelle sur la HAUTE SAISON touristique (été côte/mer, hiver stations de ski : tension sur les créneaux samedi, conseil de réserver le prestataire à l'avance si constaté). legalFacts : travail dissimulé interdit et risques pour le propriétaire (URSSAF), différence particulier-employeur (CESU) vs entreprise de ménage (facture, assurance RC pro), frais de ménage facturables au voyageur sur les plateformes, TVA/auto-entrepreneur si sourcé. scamWarnings : pièges documentés (prestataire non déclaré = responsabilité du propriétaire, absence d'assurance casse/dégâts, no-show en haute saison sans contrat, suppléments surprise, photos d'état des lieux absentes). goodReflexes : 4 à 6 bons réflexes du propriétaire (contrat récurrent écrit, vérifier SIRET et RC pro, check-list de ménage partagée, synchronisation avec le calendrier de réservation, remise des clés sécurisée, photos avant/après). Contraintes : chiffres sourcés uniquement, France.`,
};

async function fetchOne(metier: string, prompt: string) {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "sonar", messages: [{ role: "user", content: prompt }], temperature: 0.1 }),
  });
  if (!res.ok) throw new Error(`Perplexity ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content || "";
  const citations: string[] =
    (Array.isArray(data.citations) ? data.citations : null) ||
    (Array.isArray(data.search_results)
      ? data.search_results.map((s: { url?: string }) => s.url).filter(Boolean)
      : []) ||
    [];
  const m = content.match(/\{[\s\S]*\}/);
  if (!m) throw new Error(`${metier}: pas de JSON dans la réponse`);
  const parsed = JSON.parse(m[0].replace(/\[\d+\]/g, ""));
  return {
    ...parsed,
    sources: citations.slice(0, 6),
    retrievedAt: new Date().toISOString().slice(0, 10),
  };
}

async function main() {
  let file = fs.readFileSync(DEST, "utf8");
  for (const [metier, prompt] of Object.entries(PROMPTS)) {
    if (new RegExp(`^  ${metier}:`, "m").test(file)) {
      console.log(`⏭️  ${metier} déjà présent — sauté`);
      continue;
    }
    console.log(`Sourcing ${metier}...`);
    const entry = await fetchOne(metier, prompt);
    const block = `  ${metier}: ${JSON.stringify(entry, null, 2).replace(/\n/g, "\n  ")},\n`;
    // insertion avant la fermeture du record `};`
    const idx = file.lastIndexOf("};");
    file = file.slice(0, idx) + block + file.slice(idx);
    console.log(
      `  ✓ ${entry.priceRanges?.length} fourchettes · ${entry.legalFacts?.length} faits légaux · ${entry.scamWarnings?.length} arnaques · ${entry.sources?.length} sources`
    );
    for (const r of entry.priceRanges || []) console.log(`    • ${r.label} : ${r.low}–${r.high} €`);
  }
  fs.writeFileSync(DEST, file);
  console.log(`\n✓ écrit : ${DEST}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
