/**
 * Publie 12 articles GEO comparatifs, un par departement de
 * Nouvelle-Aquitaine, sur "Comment obtenir des leads qualifies en
 * tant qu'artisan en [Dept] : guide 2026".
 *
 * Strategie anti-duplicate : chaque article a ~40-50% de contenu
 * UNIQUE (intro variant, section marche local, exemple ROI sur ville
 * locale, conclusion specifique). Les ~50% restant (tableau plateformes,
 * methodologie ROI, tips conversion) sont des sections referentielles
 * qui sont OK chez Google si le reste varie reellement.
 *
 * Donnees personnalisees par dept :
 *   - Population dept (Supabase cities.population)
 *   - Nombre de pros actifs (Supabase pros)
 *   - Top 3 villes (Supabase cities ordered by population)
 *   - Chef-lieu
 *   - Particularites economiques connues (hardcoded ci-dessous)
 *
 * Variations templates :
 *   - 3 variants d'intro (rotation 4-4-4)
 *   - 3 variants de conclusion (rotation 4-4-4)
 *   - Ordre alterne de presentation des 6 canaux
 *
 * Run :
 *   npx tsx scripts/seed-blog-leads-by-dept.ts          # dry-run
 *   npx tsx scripts/seed-blog-leads-by-dept.ts --apply  # publication reelle
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
  override: true,
});

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APPLY = process.argv.includes("--apply");

// ============================================================
// Particularites economiques connues par dept (pour variance)
// ============================================================
type DeptContext = {
  intro: string; // 3-5 phrases : marche local, particularites
  example_metier: string; // metier choisi pour l'exemple ROI
  example_city: string; // ville pour l'exemple ROI
  example_panier: number; // panier moyen euros HT pour ce metier dans ce dept
  closing: string; // 2-3 phrases conclusion locale
};

const DEPT_CONTEXTS: Record<string, DeptContext> = {
  "16": {
    intro:
      "La Charente conjugue tissus industriels (Angoulême avec la cité de l'image et de la bande dessinée, Cognac avec ses maisons d'eaux-de-vie historiques) et une ruralité encore prégnante. Le marché BTP local est tiré par la rénovation du parc ancien, particulièrement dense dans les centres anciens d'Angoulême et de Cognac, et par la résidence secondaire dans le Sud-Charente.",
    example_metier: "couvreur",
    example_city: "Angoulême",
    example_panier: 2400,
    closing:
      "Les artisans implantés en Charente, qu'ils interviennent sur le bassin de l'Angoumois, sur le secteur de Cognac ou sur le Sud-Charente plus rural, gagnent à structurer leur acquisition autour d'un canal organique (Google Business Profile) complété par un canal plateforme adapté au volume souhaité.",
  },
  "17": {
    intro:
      "La Charente-Maritime se distingue par une économie côtière forte : tourisme balnéaire (Île de Ré, Île d'Oléron, Royan), activité portuaire (La Rochelle), ostréiculture du bassin de Marennes-Oléron. Le marché BTP y est saisonnier (forte pression mai-septembre sur les résidences secondaires et locations) et capté par une concurrence intense sur la zone littorale, plus détendu dans l'arrière-pays.",
    example_metier: "plombier",
    example_city: "La Rochelle",
    example_panier: 850,
    closing:
      "Les artisans en Charente-Maritime bénéficient d'un marché soutenu en saison mais doivent anticiper la baisse d'activité hivernale. Diversifier ses canaux d'acquisition entre littoral (La Rochelle, Royan, Saintes) et intérieur (Saint-Jean-d'Angély, Surgères) est souvent la clé d'une activité régulière sur l'année.",
  },
  "19": {
    intro:
      "La Corrèze affiche une dynamique économique contrastée : Brive-la-Gaillarde joue le rôle de plate-forme logistique entre Limoges et Toulouse, Tulle reste un centre administratif et industriel modéré, tandis que le Plateau de Millevaches reflète la ruralité profonde du département. Le marché BTP local est porté par la rénovation énergétique (parc ancien dominant) et par les résidences secondaires sur la zone sud du département.",
    example_metier: "maçon",
    example_city: "Brive-la-Gaillarde",
    example_panier: 5800,
    closing:
      "Pour les artisans corréziens, qui couvrent souvent une zone d'intervention large compte tenu de la faible densité, les outils digitaux d'acquisition de leads présentent un intérêt accru : ils permettent d'optimiser les déplacements en sélectionnant des chantiers groupés géographiquement.",
  },
  "23": {
    intro:
      "La Creuse est le département le moins peuplé de France métropolitaine. Sa démographie déclinante (plus de personnes âgées que la moyenne nationale) crée des opportunités spécifiques pour les artisans : forte demande sur l'adaptation des logements au vieillissement, rénovation énergétique du parc rural ancien, entretien des résidences secondaires. La tapisserie d'Aubusson reste une signature culturelle du territoire.",
    example_metier: "menuisier",
    example_city: "Guéret",
    example_panier: 1900,
    closing:
      "Dans un département rural comme la Creuse, le bouche-à-oreille et la proximité géographique restent les leviers principaux d'acquisition. Les plateformes digitales jouent un rôle complémentaire pour capter les propriétaires de résidences secondaires (souvent franciliens) qui ne peuvent pas mobiliser leur réseau local pour trouver un artisan.",
  },
  "24": {
    intro:
      "La Dordogne combine un patrimoine touristique exceptionnel (vallée de la Dordogne, sites préhistoriques de Lascaux et de la vallée de la Vézère), une gastronomie identitaire (foie gras, truffe noire du Périgord) et un parc immobilier ancien à fort potentiel de rénovation. Le tourisme international et le marché des résidences secondaires britanniques et néerlandaises soutiennent durablement l'activité BTP locale.",
    example_metier: "carreleur",
    example_city: "Périgueux",
    example_panier: 3200,
    closing:
      "Les artisans en Dordogne, qu'ils travaillent sur le bassin de Périgueux, sur Bergerac et son vignoble, ou sur la vallée de la Dordogne touristique, profitent d'un marché diversifié. Capter les leads de résidences secondaires (souvent en anglais) peut justifier un investissement dans des canaux digitaux ciblant ce profil.",
  },
  "33": {
    intro:
      "La Gironde est le département le plus peuplé de Nouvelle-Aquitaine avec plus d'1,69 million d'habitants. Bordeaux Métropole concentre une grande partie de la dynamique économique régionale : vignoble bordelais inscrit à l'UNESCO, port maritime, attractivité résidentielle continue, programmes immobiliers neufs nombreux. Le bassin d'Arcachon constitue un second pôle, fortement marqué par le tourisme et les résidences secondaires.",
    example_metier: "électricien",
    example_city: "Bordeaux",
    example_panier: 1200,
    closing:
      "Le marché BTP en Gironde, particulièrement à Bordeaux, Mérignac, Pessac et sur le bassin d'Arcachon, est un des plus actifs de la région. La concurrence entre artisans y est forte, ce qui rend la stratégie d'acquisition de leads d'autant plus déterminante : se différencier par la réactivité et la qualité de présentation est crucial.",
  },
  "40": {
    intro:
      "Les Landes combinent un littoral atlantique attractif (Hossegor, Capbreton, Mimizan, Biscarrosse), une vaste forêt landaise productive, et un pôle thermal et économique à Dax. Le marché BTP local connaît une pression saisonnière forte sur la côte (constructions et rénovations de résidences secondaires) et une activité régulière dans l'intérieur des terres, notamment sur Mont-de-Marsan.",
    example_metier: "peintre",
    example_city: "Mont-de-Marsan",
    example_panier: 1800,
    closing:
      "Pour les artisans landais, distinguer son positionnement entre littoral (où la concurrence et les prix sont élevés) et intérieur des terres (où le bouche-à-oreille reste prédominant) est essentiel. Les plateformes digitales offrent une visibilité utile sur la cible des résidences secondaires côtières.",
  },
  "47": {
    intro:
      "Le Lot-et-Garonne occupe une position de carrefour entre les bassins économiques bordelais et toulousain. Agen reste un pôle agricole et tertiaire majeur (pruneau d'Agen en label IGP, plate-forme TGV), Villeneuve-sur-Lot et Marmande constituent des centres secondaires. Le marché BTP local est porté par la rénovation du parc rural et péri-urbain ainsi que par l'attractivité résidentielle, dynamisée par le coût du logement plus accessible que dans les métropoles voisines.",
    example_metier: "plaquiste",
    example_city: "Agen",
    example_panier: 2100,
    closing:
      "Le positionnement géographique du Lot-et-Garonne, à mi-chemin entre Bordeaux et Toulouse, offre aux artisans locaux une opportunité : capter une clientèle qui apprécie le rapport qualité-prix plus avantageux qu'en métropole tout en bénéficiant des standards de service attendus en zone urbaine.",
  },
  "64": {
    intro:
      "Les Pyrénées-Atlantiques rassemblent plusieurs territoires aux dynamiques distinctes : la côte basque (Biarritz, Saint-Jean-de-Luz, Anglet) au tourisme international affirmé, la métropole tri-villes Bayonne-Anglet-Biarritz (BAB), le Béarn avec Pau et son économie tertiaire et thermale, la zone montagneuse au sud avec ses stations de ski et thermalisme. Le marché BTP y est l'un des plus diversifiés et dynamiques de la région.",
    example_metier: "menuisier",
    example_city: "Pau",
    example_panier: 2700,
    closing:
      "Les artisans en Pyrénées-Atlantiques évoluent dans un marché à plusieurs vitesses : très concurrentiel sur la côte basque (prix élevés mais clientèle exigeante), plus accessible sur le Béarn. Adapter sa stratégie d'acquisition aux spécificités locales — bilingue espagnol/basque pour la côte, par exemple — peut faire la différence.",
  },
  "79": {
    intro:
      "Les Deux-Sèvres ont une économie tirée par Niort (capitale française des mutuelles d'assurance avec MAIF, MAAF, Macif, Smacl) et par l'agriculture, notamment dans le Marais poitevin. Bressuire et Thouars constituent des centres secondaires actifs au nord du département. Le marché BTP local est porté par l'attractivité résidentielle de Niort (cadres mutualistes) et par la rénovation du parc rural ancien.",
    example_metier: "chauffagiste",
    example_city: "Niort",
    example_panier: 4200,
    closing:
      "Pour les artisans en Deux-Sèvres, capter la clientèle des actifs de Niort (souvent CSP+ travaillant dans les sièges mutualistes) demande un positionnement de qualité, tandis que le marché rural du Bocage bressuirais ou du Marais poitevin reste sensible au bouche-à-oreille et au tarif. Une stratégie d'acquisition différenciée selon la zone est souvent payante.",
  },
  "86": {
    intro:
      "La Vienne s'organise autour de Poitiers, ville universitaire (plus de 27 000 étudiants), pôle d'innovation (technopole du Futuroscope, parc des espaces numériques) et capitale administrative. Châtellerault au nord constitue un centre industriel et logistique notable. Le marché BTP local est porté par l'attractivité étudiante et résidentielle, ainsi que par la rénovation du parc ancien de Poitiers intra-muros.",
    example_metier: "électricien",
    example_city: "Poitiers",
    example_panier: 1450,
    closing:
      "Les artisans de la Vienne, qu'ils interviennent à Poitiers, Châtellerault ou sur les communes péri-urbaines, profitent d'un marché stable et diversifié. La présence universitaire crée une demande spécifique sur la rénovation de petits logements locatifs, à valoriser dans le positionnement commercial.",
  },
  "87": {
    intro:
      "La Haute-Vienne est marquée par Limoges, son chef-lieu, capitale historique de la porcelaine et de l'émail, et par Saint-Junien, ancien centre de ganterie reconverti. Le département connaît une démographie en léger déclin, avec une majorité du parc immobilier ancien à rénover. La rénovation énergétique soutenue par MaPrimeRénov constitue un levier important d'activité pour les artisans locaux.",
    example_metier: "couvreur",
    example_city: "Limoges",
    example_panier: 3500,
    closing:
      "En Haute-Vienne, les artisans peuvent capitaliser sur deux dynamiques : la rénovation énergétique du parc ancien (très soutenue par MaPrimeRénov dans le département) et le marché des copropriétés du centre-ville de Limoges. Diversifier ses canaux d'acquisition entre ces deux segments optimise l'activité.",
  },
};

// ============================================================
// Helpers
// ============================================================

function generateDepartmentSlug(name: string, code: string): string {
  const cleaned = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${cleaned}-${code}`;
}

function fmt(n: number): string {
  return n.toLocaleString("fr-FR");
}

// 3 variantes d'intros sur le marche regional (alternees)
function buildIntroGenerale(deptName: string, variant: number): string {
  if (variant === 0) {
    return `Pour un artisan ou une TPE du BTP, la question n'est donc pas tant l'existence d'une demande que sa capture. Sur un marché fragmenté où chaque chantier se joue souvent à la rapidité de réponse et à la qualité du premier contact, la stratégie d'acquisition de leads devient un avantage concurrentiel décisif. Ce guide passe en revue les 6 canaux principaux disponibles aujourd'hui pour un artisan en ${deptName}, compare honnêtement les plateformes de mise en relation, et propose une méthodologie de calcul du retour sur investissement.`;
  } else if (variant === 1) {
    return `Trouver des clients ne dépend plus uniquement du bouche-à-oreille pour les artisans en ${deptName}. La digitalisation du marché BTP — recherches Google locales, plateformes de mise en relation, profils professionnels en ligne — a multiplié les points de contact possibles entre un particulier ayant un projet et un professionnel disponible. Ce guide analyse les 6 leviers d'acquisition principaux et présente un comparatif objectif des plateformes accessibles en 2026.`;
  } else {
    return `La concurrence entre artisans en ${deptName}, notamment sur les marchés porteurs comme la rénovation énergétique ou l'amélioration de l'habitat, rend la captation de leads particulièrement stratégique. Les canaux d'acquisition se sont multipliés ces dernières années, avec des modèles économiques très différents (forfait fixe vs lead payant unitaire). Ce guide propose une grille de lecture neutre pour choisir les canaux les plus adaptés à son profil d'artisan.`;
  }
}

// 3 variantes de conclusion generale (alternees)
function buildConclusionGenerale(variant: number, deptName: string): string {
  if (variant === 0) {
    return `Au-delà du choix de la plateforme, le facteur déterminant reste la qualité d'exécution sur les leads reçus : réactivité, personnalisation, soin du devis, suivi structuré. Pour les artisans en ${deptName} qui souhaitent simplement être référencés gratuitement dans l'annuaire (sans engagement financier), la fiche sur [Workwave](/pro) reste accessible et modifiable à vie. L'abonnement à 39 €/mois ne devient pertinent que pour ceux qui souhaitent recevoir activement les leads routés automatiquement.`;
  } else if (variant === 1) {
    return `La meilleure stratégie d'acquisition reste celle qui combine plusieurs canaux complémentaires plutôt que de tout miser sur un seul. Un artisan en ${deptName} qui couple Google Business Profile (canal gratuit fondamental), un annuaire local et une plateforme de leads à coût maîtrisé construit progressivement un flux régulier de demandes qualifiées. [Workwave](/pro) propose un essai gratuit de 14 jours sans carte bancaire pour tester son modèle 39 €/mois sans engagement avant tout investissement.`;
  } else {
    return `Pour les artisans en ${deptName} qui démarrent leur activité ou souhaitent diversifier leur acquisition, l'enjeu n'est pas de choisir la "meilleure" plateforme dans l'absolu mais celle qui correspond à son profil (volume souhaité, taux de conversion historique, capacité financière). [Workwave](/pro) se positionne sur le segment du forfait fixe à coût prévisible, avec une fiche gratuite à vie même sans abonnement. Ce modèle convient particulièrement aux artisans qui privilégient la simplicité budgétaire.`;
  }
}

// Bloc tableau comparatif (avec preambule personnalise dept)
function buildComparatifTable(deptName: string): string {
  const preambule = `Voici un panorama des principales plateformes de leads pour artisans accessibles en ${deptName}. Les chiffres sont issus des sites publics des plateformes au moment de la rédaction et peuvent évoluer.`;

  return `${preambule}

| Plateforme | Modèle | Prix indicatif | Couverture | Exclusivité du lead |
|------------|--------|----------------|------------|---------------------|
| Habitatpresto | Lead payant unitaire | Environ 50 à 100 € par lead selon métier | National | Lead partagé (3 à 5 artisans) |
| StarOfService | Crédits par lead | 15 à 80 € par lead selon métier | National | Lead partagé (3 à 5 pros) |
| Travaux.com | Abonnement + lead | Variable selon offre | National | Lead partagé |
| Workwave | Abonnement forfaitaire | 39 €/mois ou 390 €/an, sans engagement, 14 jours d'essai gratuit sans CB | Nouvelle-Aquitaine | Routage à 3 artisans qualifiés par projet |
| Pages Jaunes Pro | Abonnement annuel | 150 à 400 €/mois selon visibilité | National | Visibilité passive (pas de routing) |`;
}

// ============================================================
// Generation du contenu complet d'un article par dept
// ============================================================

function buildArticleContent(params: {
  deptName: string;
  deptCode: string;
  population: number;
  prosCount: number;
  topCities: { name: string; population: number | null }[];
  ctx: DeptContext;
  introVariant: number;
  conclusionVariant: number;
}): string {
  const {
    deptName,
    deptCode,
    population,
    prosCount,
    topCities,
    ctx,
    introVariant,
    conclusionVariant,
  } = params;

  const topCitiesList = topCities
    .slice(0, 3)
    .map((c) => `${c.name}${c.population ? ` (${fmt(c.population)} habitants)` : ""}`)
    .join(", ");

  // Exemple ROI personnalise avec ville + metier du dept
  const exempleROI = `Prenons un exemple. Un ${ctx.example_metier} installé à ${ctx.example_city} reçoit 15 leads sur un mois via une plateforme. Il en transforme 6 en devis envoyés (40 %), dont 2 contrats signés (33 %). Avec un panier moyen de ${fmt(ctx.example_panier)} € HT par intervention, le chiffre d'affaires généré sur le mois est de ${fmt(ctx.example_panier * 2)} € HT.

Le coût d'acquisition par contrat (CAC) se calcule ainsi : coût total de la plateforme divisé par nombre de contrats signés.
- Avec un forfait à 39 €/mois sans coût additionnel : CAC = 39 / 2 = **19,50 € par contrat**.
- Avec un modèle lead payant à 70 € l'unité (15 leads achetés) : CAC = 1 050 / 2 = **525 € par contrat**.

L'écart est de 27 fois. Sur ce profil d'activité, le forfait est nettement plus avantageux. À l'inverse, un artisan signant 10 contrats sur 15 leads (taux de conversion exceptionnel) verrait le coût unitaire du lead payant baisser à 105 € par contrat, ce qui peut redevenir compétitif. La règle générale : plus le taux de conversion est faible, plus le forfait est avantageux ; plus il est élevé, plus le lead payant peut devenir rentable.`;

  return `## Le marché BTP en ${deptName} en 2026

${ctx.intro}

En chiffres, le département de ${deptName} (code ${deptCode}) compte environ ${fmt(population)} habitants répartis sur ses communes, dont les principales sont ${topCitiesList}. L'annuaire Workwave référence actuellement plus de ${fmt(Math.round(prosCount / 1000) * 1000)} fiches d'artisans et de professionnels du bâtiment actifs sur le département, principalement issues des bases publiques Sirene et de l'API ADEME pour les certifications RGE.

${buildIntroGenerale(deptName, introVariant)}

## Les 6 canaux principaux pour obtenir des leads artisan

### 1. Google Business Profile (gratuit)

Le profil Google Business est le levier le plus rentable pour un artisan local. Bien optimisé (photos, horaires, descriptions par service, avis), il génère naturellement des appels et des demandes de devis via Google Maps et la recherche locale. Pour un artisan en ${deptName}, c'est généralement le premier canal à investir avant tout abonnement payant.

### 2. Annuaires professionnels locaux

Les annuaires locaux comme Pages Jaunes, Workwave (spécialisé Nouvelle-Aquitaine), Mappy ou Yelp permettent une visibilité passive. Workwave référence par exemple plus de 226 000 fiches artisans sur la région entière, dont les ${fmt(Math.round(prosCount / 1000) * 1000)}+ du département ${deptName}. Le référencement de base y est gratuit, avec des options payantes pour la visibilité prioritaire.

### 3. Plateformes de mise en relation payantes

Les plateformes type Habitatpresto, StarOfService, Travaux.com ou Workwave fonctionnent sur un principe similaire : capter des demandes de particuliers et les router vers les artisans abonnés. Les modèles économiques diffèrent radicalement (lead payant unitaire vs forfait mensuel), avec des implications majeures sur le coût d'acquisition client. Le détail comparatif est présenté plus bas.

### 4. Réseaux professionnels et organisations sectorielles

La CAPEB, la Fédération Française du Bâtiment (FFB) et les chambres de métiers proposent à leurs adhérents des outils d'apporteur d'affaires, des labels (Eco-Artisan, Pro de la Performance Énergétique) et des recommandations entre membres. En ${deptName}, les antennes locales de ces organisations sont accessibles et organisent régulièrement des événements de mise en réseau professionnel.

### 5. Bouche-à-oreille et recommandations

Pour un artisan installé en ${deptName}, le bouche-à-oreille reste le canal principal en volume comme en qualité de transformation. Selon les remontées sectorielles, plus de 50 % des contrats signés par les TPE du BTP proviennent de recommandations directes. Le travail principal consiste à structurer ces recommandations (demande active d'avis Google, parrainage client, présence sur réseaux locaux).

### 6. Réseaux sociaux et communautés locales

Les groupes Facebook locaux liés à ${ctx.example_city} et aux communes environnantes, Nextdoor, et Instagram pour les métiers visuels (peintre, paysagiste, décorateur) génèrent un trafic modeste mais ciblé géographiquement. Faible coût d'entrée, retour sur investissement variable selon la régularité de publication.

## Comparatif des plateformes de mise en relation en 2026

${buildComparatifTable(deptName)}

### Pour qui chaque plateforme est-elle adaptée ?

**Habitatpresto** convient aux artisans capables d'absorber un volume élevé de leads payants à l'unité et qui mesurent finement leur taux de conversion pour rentabiliser chaque achat. Le modèle est exigeant en gestion budgétaire.

**StarOfService** est plus accessible pour démarrer car les leads sont moins chers, mais le revers est la dilution (5 pros en moyenne sur un même lead, course à la première réponse).

**Travaux.com** reste pertinent pour les artisans positionnés sur des chantiers de plus grande envergure (rénovation lourde, construction neuve) où le panier moyen justifie un investissement plateforme plus important.

**Workwave** est positionné pour les artisans implantés en Nouvelle-Aquitaine — donc parfaitement adapté pour ${deptName} — qui privilégient un coût d'abonnement prévisible plutôt que des leads payants à l'unité. Le modèle 39 €/mois sans engagement avec essai gratuit 14 jours permet de tester le service sans risque. Le routage automatique à 3 artisans qualifiés par projet (distance + équité + ancienneté) limite la dilution comparée aux plateformes nationales à 5 pros.

**Pages Jaunes Pro** reste un acteur historique pour la visibilité passive mais ne propose pas de routing automatique de leads. À considérer en complément d'autres canaux plutôt qu'en levier principal.

## Comment calculer le retour sur investissement d'une plateforme

La rentabilité d'une plateforme de leads dépend de quatre variables, à mesurer rigoureusement sur ses 3 à 6 premiers mois d'utilisation :

1. **Coût total mensuel** (abonnement + coût unitaire des leads payés)
2. **Nombre de leads reçus** sur la période
3. **Taux de transformation lead → devis** (variable selon le métier, généralement entre 20 et 50 % sur le BTP selon les remontées sectorielles)
4. **Taux de transformation devis → contrat signé** (généralement entre 15 et 40 % selon la qualification du lead et la qualité du devis)
5. **Panier moyen** par contrat signé

### Exemple de calcul concret

${exempleROI}

## Tips concrets pour optimiser la conversion des leads reçus

Quelle que soit la plateforme choisie, certaines pratiques améliorent significativement le taux de conversion :

- **Répondre en moins de 2 heures.** La réactivité est le facteur numéro un cité dans toutes les études sectorielles. Un lead recontacté dans l'heure a un taux de conversion plusieurs fois supérieur à un lead recontacté à 24 h.
- **Personnaliser le premier contact.** Mentionner un détail spécifique de la demande (type de chantier, contrainte évoquée) signale à l'utilisateur que la lecture a été faite, et augmente sensiblement la prise de rendez-vous.
- **Proposer une visite ou un échange téléphonique** avant le devis. Un devis envoyé à froid sans interaction préalable convertit beaucoup moins qu'un devis remis après une visite.
- **Soigner la présentation du devis** (logo, conditions claires, garanties mentionnées, RC Pro et décennale visibles, photos de réalisations similaires si possible).
- **Relancer une fois après l'envoi du devis** sous 5 à 7 jours. Beaucoup de contrats se signent sur la deuxième relance.

## Conclusion : quelle stratégie pour un artisan en ${deptName} ?

${ctx.closing}

${buildConclusionGenerale(conclusionVariant, deptName)}

Pour aller plus loin, consulter aussi le [guide général sur l'acquisition de leads en Nouvelle-Aquitaine](/blog/obtenir-leads-artisan-nouvelle-aquitaine-guide-2026) qui détaille les fondamentaux applicables au-delà du seul département.
`;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log(`=== Publication 12 articles GEO leads artisans ===`);
  console.log(`Mode : ${APPLY ? "APPLY (publication reelle)" : "DRY-RUN"}\n`);

  const { data: depts } = await supabase
    .from("departments")
    .select("id, code, name")
    .order("code");

  if (!depts) {
    console.error("Erreur : pas de departements");
    return;
  }

  let introVariant = 0;
  let conclusionVariant = 0;
  let totalInserted = 0;
  let totalSkipped = 0;

  for (const d of depts) {
    const ctx = DEPT_CONTEXTS[d.code];
    if (!ctx) {
      console.log(`⚠️  Dept ${d.code} ${d.name} : pas de contexte defini, skip`);
      continue;
    }

    // Population dept (somme cities)
    const { data: allCities } = await supabase
      .from("cities")
      .select("id, name, population")
      .eq("department_id", d.id);
    const population = (allCities || []).reduce(
      (sum, c) => sum + (c.population || 0),
      0
    );
    const topCities = (allCities || [])
      .filter((c) => c.population)
      .sort((a, b) => (b.population || 0) - (a.population || 0))
      .slice(0, 3);

    // Pros count
    const cityIds = (allCities || []).map((c) => c.id);
    const { count: prosCount } = await supabase
      .from("pros")
      .select("*", { count: "estimated", head: true })
      .in("city_id", cityIds)
      .eq("is_active", true)
      .is("deleted_at", null);

    const deptSlug = generateDepartmentSlug(d.name, d.code);
    const slug = `obtenir-leads-artisan-${deptSlug}-guide-2026`;
    const title = `Comment obtenir des leads qualifiés en tant qu'artisan en ${d.name} : guide 2026`;
    const metaDescription = `Guide 2026 pour artisans en ${d.name} (${d.code}) : 6 canaux d'acquisition, comparatif plateformes leads (Habitatpresto, StarOfService, Workwave), méthodologie ROI.`;

    const content = buildArticleContent({
      deptName: d.name,
      deptCode: d.code,
      population,
      prosCount: prosCount || 0,
      topCities,
      ctx,
      introVariant: introVariant % 3,
      conclusionVariant: conclusionVariant % 3,
    });

    console.log(`\n${d.code} ${d.name}`);
    console.log(`  slug      : ${slug}`);
    console.log(`  title     : ${title}`);
    console.log(`  intro var : ${introVariant % 3} | conclu var : ${conclusionVariant % 3}`);
    console.log(`  content   : ${content.length} chars (~${Math.round(content.split(/\s+/).length)} mots)`);

    if (!APPLY) {
      introVariant++;
      conclusionVariant++;
      continue;
    }

    // Anti-doublon
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) {
      console.log(`  ⚠️  deja en BDD (id=${existing.id}), skip`);
      totalSkipped++;
      continue;
    }

    const now = new Date().toISOString();
    const { error } = await supabase.from("blog_posts").insert({
      slug,
      title,
      meta_description: metaDescription,
      content,
      category_slug: null,
      city_slug: null,
      tags: ["artisan", "lead", "Nouvelle-Aquitaine", d.name, "BTP", "guide"],
      author: "L'équipe Workwave",
      status: "published",
      published_at: now,
    });

    if (error) {
      console.error(`  ✗ erreur insertion :`, error);
    } else {
      console.log(`  ✓ publie : https://workwave.fr/blog/${slug}`);
      totalInserted++;
    }

    introVariant++;
    conclusionVariant++;

    // Petit delay pour eviter rate limit Supabase
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n=== RECAP ===`);
  console.log(`Inseres : ${totalInserted}`);
  console.log(`Skipped : ${totalSkipped}`);

  if (!APPLY) {
    console.log(`\n[DRY-RUN] Pour appliquer :`);
    console.log(`  npx tsx scripts/seed-blog-leads-by-dept.ts --apply`);
  }
}

main().catch(console.error);
