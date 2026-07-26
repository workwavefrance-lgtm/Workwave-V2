/**
 * Récupère des fourchettes de prix 2025 RÉELLES + sources via Perplexity API,
 * pour remplacer les PRICE_RANGES hardcodés de lib/seo/seo-sections.ts.
 *
 * Sortie : lib/data/sourced-prices.ts (statique → ISR-safe, aucune requête au rendu).
 * Le helper seo-sections.ts lira ce fichier en priorité (fallback hardcodé sinon).
 *
 * 1 requête Perplexity par catégorie (~13) ≈ $0.07 total.
 * Modèle : sonar (recherche web + citations). Respecte « zéro chiffre inventé » :
 * les chiffres viennent de sources web réelles, citées.
 *
 * Usage : npx tsx scripts/fetch-sourced-prices.ts [--dry-run]
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const KEY = process.env.PERPLEXITY_API_KEY;
const DRY = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force"); // re-génère TOUT, sinon on complète les manquants
if (!KEY) {
  console.error("❌ PERPLEXITY_API_KEY manquante dans .env.local");
  process.exit(1);
}

// slug -> nom pour le prompt
const NOM: Record<string, string> = {
  plombier: "plombier",
  electricien: "électricien",
  macon: "maçon",
  peintre: "peintre en bâtiment",
  carreleur: "carreleur",
  menuisier: "menuisier",
  couvreur: "couvreur",
  chauffagiste: "chauffagiste",
  jardinage: "jardinier / service de jardinage",
  menage: "service de ménage à domicile",
  "soutien-scolaire": "professeur de soutien scolaire (cours particuliers)",
  "garde-enfants": "service de garde d'enfants à domicile",
  "aide-seniors": "service d'aide à domicile pour personnes âgées",
  // --- 40 métiers ajoutés (couverture complète des 52 pages racine) ---
  architecte: "architecte (maîtrise d'œuvre)",
  ascensoriste: "ascensoriste (entretien et installation d'ascenseurs)",
  charpentier: "charpentier",
  climaticien: "climaticien (installateur de climatisation)",
  cuisiniste: "cuisiniste (conception et pose de cuisine)",
  "decorateur-interieur": "décorateur d'intérieur",
  "diagnostic-immobilier": "diagnostiqueur immobilier",
  elagueur: "élagueur",
  facadier: "façadier (ravalement de façade)",
  "videosurveillance-installateur": "installateur de vidéosurveillance et d'alarme",
  paysagiste: "paysagiste",
  pisciniste: "pisciniste (construction et entretien de piscine)",
  plaquiste: "plaquiste (pose de placo et cloisons)",
  ramoneur: "ramoneur",
  serrurier: "serrurier",
  terrassier: "terrassier",
  vitrier: "vitrier",
  "assistance-informatique": "technicien d'assistance informatique à domicile",
  "couture-retouches": "couturier / atelier de retouches",
  debarras: "entreprise de débarras",
  demenagement: "déménageur",
  "depannage-electromenager": "réparateur d'électroménager",
  "nettoyage-pro": "entreprise de nettoyage professionnel",
  "livraison-de-courses": "service de livraison de courses à domicile",
  manutention: "service de manutention / portage",
  "montage-meubles": "monteur de meubles",
  multiservice: "homme toutes mains (multiservice)",
  "nettoyage-vitres": "laveur de vitres",
  "petit-bricolage": "service de petit bricolage à domicile",
  repassage: "service de repassage à domicile",
  "traitement-nuisibles": "entreprise de traitement des nuisibles (dératisation, désinsectisation)",
  "accompagnement-handicap": "service d'accompagnement de personnes en situation de handicap",
  "aide-administrative": "service d'aide administrative",
  "coach-sportif": "coach sportif",
  "coiffure-domicile": "coiffeur à domicile",
  "cours-musique": "professeur de musique (cours particuliers)",
  "cours-particuliers": "professeur pour cours particuliers",
  "esthetique-domicile": "esthéticienne à domicile",
  "garde-animaux": "service de garde d'animaux (pet-sitting)",
  "promenade-animaux": "promeneur de chiens (dog-walker)",
};

// slug -> libellés exacts (copiés de PRICE_RANGES, source de vérité des prestations)
const CATS: Record<string, string[]> = {
  plombier: ["Intervention de dépannage simple", "Recherche de fuite non destructive", "Remplacement de chauffe-eau électrique", "Rénovation complète de salle de bain", "Débouchage de canalisation"],
  electricien: ["Diagnostic et dépannage simple", "Remplacement d'un disjoncteur", "Pose de prise (par unité)", "Mise aux normes NF C 15-100 (100 m²)", "Tableau électrique complet"],
  macon: ["Terrasse béton (par m²)", "Ouverture mur porteur", "Ravalement de façade (par m²)", "Extension maison (par m²)", "Pose de parpaings (par m²)"],
  peintre: ["Peinture mur (par m²)", "Peinture plafond (par m²)", "Pièce complète (10-15 m²)", "Ravalement façade (par m²)", "Pose papier peint (par m²)"],
  carreleur: ["Pose de carrelage au sol (par m²)", "Faïence murale (par m²)", "Carrelage grand format (par m²)", "Douche à l'italienne complète", "Carrelage extérieur (par m²)"],
  menuisier: ["Pose de fenêtre (par fenêtre)", "Escalier sur mesure", "Pose de parquet (par m²)", "Placard sur mesure", "Porte intérieure pose comprise"],
  couvreur: ["Réfection complète de toiture (par m²)", "Réparation de tuiles", "Pose de gouttières (par mètre linéaire)", "Pose de Velux", "Démoussage de toiture (par m²)"],
  chauffagiste: ["Entretien annuel de chaudière", "Installation de chaudière gaz", "Pompe à chaleur air/eau", "Remplacement de chauffe-eau", "Désembouage du circuit"],
  jardinage: ["Tonte de pelouse (par heure)", "Taille de haie (par mètre linéaire)", "Élagage d'arbre", "Entretien régulier (forfait mensuel)", "Création de massif"],
  menage: ["Ménage régulier à domicile (par heure)", "Nettoyage complet de printemps", "Ménage après travaux", "Lavage de vitres (par m²)", "Repassage à domicile (par heure)"],
  "soutien-scolaire": ["Cours particulier primaire (par heure)", "Cours particulier collège (par heure)", "Cours particulier lycée (par heure)", "Préparation au brevet ou baccalauréat", "Stage intensif vacances (semaine)"],
  "garde-enfants": ["Garde à domicile (par heure)", "Sortie d'école + goûter (par jour)", "Babysitting soirée", "Garde partagée (par famille)", "Garde de nuit ou week-end"],
  "aide-seniors": ["Aide à domicile (par heure)", "Aide à la toilette", "Accompagnement RDV médical", "Garde de jour ponctuelle", "Forfait mensuel régulier"],
  // --- 40 métiers ajoutés ---
  architecte: ["Dépôt de permis de construire", "Mission complète de maîtrise d'œuvre (% du coût des travaux)", "Plans d'avant-projet (esquisse)", "Étude de faisabilité", "Suivi de chantier (honoraires)"],
  ascensoriste: ["Contrat d'entretien annuel d'ascenseur", "Dépannage d'ascenseur en urgence", "Remplacement de câbles", "Modernisation d'ascenseur", "Installation d'un monte-escalier"],
  charpentier: ["Charpente traditionnelle (par m²)", "Charpente fermette industrielle (par m²)", "Réparation de charpente", "Traitement des bois de charpente (par m²)", "Ossature bois (par m²)"],
  climaticien: ["Installation d'un climatiseur mono-split", "Installation d'une climatisation multi-split", "Entretien annuel de climatisation", "Recharge de fluide frigorigène", "Dépannage de climatisation"],
  cuisiniste: ["Cuisine équipée sur mesure (entrée de gamme)", "Cuisine équipée haut de gamme", "Pose de cuisine seule (main d'œuvre)", "Plan de travail sur mesure (par mètre linéaire)", "Rénovation complète de cuisine"],
  "decorateur-interieur": ["Consultation de décoration (par heure)", "Projet déco d'une pièce", "Aménagement complet d'un logement", "Planche tendance / moodboard", "Home staging avant vente"],
  "diagnostic-immobilier": ["Diagnostic de performance énergétique (DPE)", "Pack diagnostics complet pour une vente", "Diagnostic amiante", "Diagnostic plomb (CREP)", "Diagnostic termites"],
  elagueur: ["Élagage d'un arbre (selon la hauteur)", "Abattage d'un arbre", "Taille de haie (par mètre linéaire)", "Rognage de souche", "Évacuation des déchets verts"],
  facadier: ["Ravalement de façade (par m²)", "Ravalement avec isolation extérieure ITE (par m²)", "Nettoyage de façade (par m²)", "Application d'un enduit de façade (par m²)", "Traitement hydrofuge anti-mousse (par m²)"],
  "videosurveillance-installateur": ["Installation d'une caméra de surveillance", "Kit de vidéosurveillance 4 caméras posé", "Système d'alarme complet posé", "Pose d'un visiophone / interphone", "Contrat de maintenance annuel"],
  paysagiste: ["Création de jardin paysager (par m²)", "Pose de gazon en rouleau (par m²)", "Entretien de jardin (par heure)", "Taille de haie (par mètre linéaire)", "Aménagement de terrasse ou d'allée"],
  pisciniste: ["Construction de piscine enterrée en béton", "Piscine coque polyester posée", "Rénovation de piscine / changement de liner", "Installation du local technique", "Entretien annuel de piscine"],
  plaquiste: ["Pose de cloison en placo (par m²)", "Pose d'un faux plafond (par m²)", "Doublage isolant des murs (par m²)", "Réalisation d'un placard ou d'une niche", "Bandes et enduits de finition (par m²)"],
  ramoneur: ["Ramonage de cheminée / conduit", "Ramonage de poêle à granulés", "Ramonage de chaudière", "Débistrage de conduit", "Certificat de ramonage"],
  serrurier: ["Ouverture de porte claquée", "Ouverture de porte verrouillée", "Remplacement d'une serrure", "Installation d'une porte blindée", "Pose d'une serrure multipoints"],
  terrassier: ["Terrassement (par m³)", "Location de mini-pelle avec chauffeur (par jour)", "Nivellement de terrain (par m²)", "Création d'une tranchée (par mètre linéaire)", "Évacuation de terre et gravats (par m³)"],
  vitrier: ["Remplacement d'une vitre simple", "Remplacement d'un double vitrage", "Vitrage sur mesure", "Dépannage vitrerie en urgence", "Pose d'un miroir sur mesure"],
  "assistance-informatique": ["Dépannage informatique à domicile (par heure)", "Installation et configuration d'un ordinateur", "Suppression de virus", "Installation d'une box et réseau wifi", "Cours d'initiation informatique (par heure)"],
  "couture-retouches": ["Ourlet de pantalon", "Retouche d'une robe ou d'une veste", "Remplacement d'une fermeture éclair", "Cintrage / reprise d'un vêtement", "Retouche de robe de mariée"],
  debarras: ["Débarras d'appartement complet", "Débarras de cave ou de grenier", "Débarras de maison après succession", "Enlèvement d'encombrants (par m³)", "Débarras avec nettoyage inclus"],
  demenagement: ["Déménagement d'un studio / T1", "Déménagement d'un T2 à T3", "Déménagement d'une maison (gros volume)", "Formule économique (par heure + camion)", "Garde-meuble (par mois)"],
  "depannage-electromenager": ["Diagnostic et déplacement", "Réparation d'un lave-linge", "Réparation d'un lave-vaisselle", "Réparation d'un réfrigérateur", "Réparation d'un four ou d'une plaque"],
  "nettoyage-pro": ["Nettoyage de bureaux (par m²)", "Nettoyage de fin de chantier (par m²)", "Nettoyage de copropriété (forfait mensuel)", "Nettoyage de vitres professionnel", "Remise en état après sinistre"],
  "livraison-de-courses": ["Livraison de courses (par course)", "Abonnement livraison hebdomadaire", "Courses et portage à domicile pour senior", "Livraison express", "Forfait courses + pharmacie"],
  manutention: ["Aide au chargement / déchargement (par heure)", "Portage de meubles lourds", "Manutention à deux personnes (par heure)", "Débarras avec manutention", "Location de main d'œuvre à la journée"],
  "montage-meubles": ["Montage d'un meuble (par meuble)", "Montage d'une cuisine en kit", "Montage d'une armoire ou d'un dressing", "Fixation murale (TV, étagères)", "Montage de mobilier de jardin"],
  multiservice: ["Intervention homme toutes mains (par heure)", "Petits travaux de plomberie", "Petits travaux d'électricité", "Retouches de peinture", "Forfait demi-journée"],
  "nettoyage-vitres": ["Nettoyage de vitres (par m²)", "Vitres et volets roulants", "Nettoyage de baie vitrée ou véranda", "Vitrerie en hauteur (à la perche)", "Forfait maison complète"],
  "petit-bricolage": ["Intervention de bricolage (par heure)", "Pose d'étagères ou de tringles", "Petits travaux de plomberie", "Changement d'un luminaire", "Forfait demi-journée"],
  repassage: ["Repassage à domicile (par heure)", "Panier de repassage (forfait)", "Repassage et pliage", "Abonnement mensuel de repassage", "Repassage de linge délicat"],
  "traitement-nuisibles": ["Traitement anti-cafards / blattes", "Désinsectisation punaises de lit", "Dératisation", "Destruction de nid de guêpes ou frelons", "Traitement anti-termites"],
  "accompagnement-handicap": ["Aide à domicile handicap (par heure)", "Accompagnement aux sorties", "Aide à la toilette et à l'habillage", "Garde de jour", "Forfait mensuel régulier"],
  "aide-administrative": ["Aide aux démarches administratives (par heure)", "Rédaction de courriers", "Aide à la déclaration d'impôts", "Classement et gestion de dossiers", "Forfait mensuel"],
  "coach-sportif": ["Séance de coaching individuel", "Pack de 10 séances", "Coaching à domicile", "Coaching en visio", "Programme personnalisé mensuel"],
  "coiffure-domicile": ["Coupe femme à domicile", "Coupe homme à domicile", "Couleur ou mèches", "Coupe et brushing", "Chignon / coiffure de mariage"],
  "cours-musique": ["Cours de piano (par heure)", "Cours de guitare (par heure)", "Cours de chant (par heure)", "Cours de solfège", "Forfait mensuel (4 cours)"],
  "cours-particuliers": ["Cours particulier niveau primaire (par heure)", "Cours particulier niveau collège (par heure)", "Cours particulier niveau lycée (par heure)", "Cours de langue (par heure)", "Stage intensif (semaine)"],
  "esthetique-domicile": ["Épilation à domicile", "Soin du visage", "Manucure / pose de vernis", "Maquillage (événement ou mariage)", "Forfait beauté complet"],
  "garde-animaux": ["Garde d'animaux à domicile (par jour)", "Pension pour chien (par nuit)", "Visite à domicile (par visite)", "Garde de chat pendant les vacances", "Pet-sitting longue durée (forfait semaine)"],
  "promenade-animaux": ["Promenade de chien (par balade)", "Forfait hebdomadaire de promenades", "Promenade collective", "Promenade et visite à domicile", "Garde et promenade à la journée"],
};

type Range = { label: string; range: string };
type Entry = { ranges: Range[]; sources: string[]; retrievedAt: string };

function buildPrompt(slug: string, labels: string[]): string {
  const metier = NOM[slug] || slug;
  const year = new Date().getFullYear();
  return (
    `En France en ${year}, indique la fourchette de prix moyenne TTC FACTURÉE PAR UN ARTISAN pour un ${metier}, ` +
    `pour CHACUNE de ces prestations précises, en te basant sur des sources web récentes et fiables :\n` +
    labels.map((l, i) => `${i + 1}. ${l}`).join("\n") +
    `\n\nRÈGLES IMPÉRATIVES :\n` +
    `- Prix TOUT COMPRIS (fourniture + pose/main d'œuvre) dès que la prestation implique une installation — JAMAIS le prix du matériel seul.\n` +
    `- Une fourchette DISTINCTE, spécifique et réaliste pour CHAQUE prestation — n'utilise jamais deux fois la même fourchette.\n` +
    `- Chiffres conformes à ce que paie réellement un particulier qui fait appel à un pro.\n\n` +
    `Réponds UNIQUEMENT avec un objet JSON valide (aucun texte avant ou après), au format EXACT :\n` +
    `{"ranges":[{"label":"<le libellé exact fourni>","range":"<ex: 80 € à 150 €>"}]}\n` +
    `Garde les libellés STRICTEMENT identiques et dans le MÊME ordre.`
  );
}

async function fetchCat(slug: string, labels: string[]): Promise<{ entry: Entry | null; cost: number }> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar",
      temperature: 0.1,
      messages: [{ role: "user", content: buildPrompt(slug, labels) }],
    }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  const cost = data?.usage?.cost?.total_cost || 0;
  if (!res.ok || !data?.choices) {
    console.log(`  ✗ ${slug}: API error ${res.status} ${JSON.stringify(data).slice(0, 120)}`);
    return { entry: null, cost };
  }
  const content: string = data.choices[0]?.message?.content || "";
  const citations: string[] =
    (Array.isArray(data.citations) ? data.citations : null) ||
    (Array.isArray(data.search_results) ? data.search_results.map((s: { url?: string }) => s.url).filter(Boolean) : []) ||
    [];
  const m = content.match(/\{[\s\S]*\}/);
  if (!m) {
    console.log(`  ✗ ${slug}: pas de JSON dans la réponse`);
    return { entry: null, cost };
  }
  let parsed: { ranges?: Range[] };
  try {
    parsed = JSON.parse(m[0]);
  } catch {
    console.log(`  ✗ ${slug}: JSON invalide`);
    return { entry: null, cost };
  }
  const got = parsed.ranges || [];
  // Alignement par index sur NOS libellés (robuste si Perplexity reformule légèrement)
  const ranges: Range[] = labels
    .map((label, i) => ({ label, range: (got[i]?.range || "").trim() }))
    .filter((r) => r.range.length > 0 && /\d/.test(r.range));
  if (ranges.length === 0) {
    console.log(`  ✗ ${slug}: 0 fourchette exploitable`);
    return { entry: null, cost };
  }
  return {
    entry: { ranges, sources: citations.slice(0, 4), retrievedAt: new Date().toISOString().slice(0, 10) },
    cost,
  };
}

// Charge les prix déjà présents (le fichier est additif : on ne re-génère
// que les métiers manquants, sauf --force).
function loadExisting(): Record<string, Entry> {
  const dest = path.resolve(process.cwd(), "lib/data/sourced-prices.ts");
  if (!fs.existsSync(dest)) return {};
  const src = fs.readFileSync(dest, "utf8");
  const m = src.match(/SOURCED_PRICES[^=]*=\s*(\{[\s\S]*\});/);
  if (!m) return {};
  try {
    return JSON.parse(m[1]) as Record<string, Entry>;
  } catch {
    console.warn("⚠️  Impossible de parser les prix existants — on repart de zéro.");
    return {};
  }
}

async function main() {
  const existing = loadExisting();
  const todo = Object.entries(CATS).filter(
    ([slug]) => FORCE || !existing[slug]
  );
  console.log(
    `Fetch prix sourcés Perplexity — ${Object.keys(existing).length} déjà en base, ${todo.length} à générer${FORCE ? " (--force)" : ""}${DRY ? " (DRY RUN, 1 cat)" : ""}\n`
  );
  const fetched: Record<string, Entry> = {};
  let total = 0;
  const entries = DRY ? todo.slice(0, 1) : todo;
  for (const [slug, labels] of entries) {
    const { entry, cost } = await fetchCat(slug, labels);
    total += cost;
    if (entry) {
      fetched[slug] = entry;
      console.log(`  ✓ ${slug.padEnd(28)} ${entry.ranges.length} prix · ${entry.sources.length} sources`);
    }
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`\nOK : ${Object.keys(fetched).length}/${entries.length} générées · coût ≈ $${total.toFixed(4)}`);
  if (DRY) {
    console.log("\nDRY RUN — aperçu :\n", JSON.stringify(fetched, null, 2));
    return;
  }
  // Merge : on préserve l'existant et on ajoute/écrase les nouvelles.
  const out: Record<string, Entry> = { ...existing, ...fetched };
  const file =
    `// Prix sourcés via Perplexity API (recherche web + citations) — généré le ${new Date().toISOString().slice(0, 10)}.\n` +
    `// NE PAS éditer à la main : relancer \`npx tsx scripts/fetch-sourced-prices.ts\`.\n` +
    `// Respecte « zéro chiffre inventé » : chiffres issus de sources web réelles, citées.\n\n` +
    `export type SourcedPrice = { label: string; range: string };\n` +
    `export type SourcedPriceEntry = { ranges: SourcedPrice[]; sources: string[]; retrievedAt: string };\n\n` +
    `export const SOURCED_PRICES: Record<string, SourcedPriceEntry> = ${JSON.stringify(out, null, 2)};\n`;
  const dest = path.resolve(process.cwd(), "lib/data/sourced-prices.ts");
  fs.writeFileSync(dest, file);
  console.log(`\n📝 Écrit ${dest}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
