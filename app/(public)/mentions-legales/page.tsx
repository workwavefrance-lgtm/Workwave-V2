import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { getOrganizationSchema } from "@/lib/utils/schema";
import { BASE_URL } from "@/lib/constants";
import LegalDoc, { type LegalSection } from "@/components/legal/LegalDoc";

export const metadata: Metadata = {
  title: "Mentions legales",
  description: "Mentions legales du site Workwave.fr. Editeur, hebergeur, RGPD, cookies.",
  alternates: { canonical: "https://workwave.fr/mentions-legales" },
};

const SECTIONS: LegalSection[] = [
  {
    title: "Éditeur du site",
    blocks: [
      { p: "Le site **workwave.fr** est édité par **Willy Gauvrit**, entrepreneur individuel (micro-entreprise), exploitant sous le nom commercial « Workwave »." },
      {
        ul: [
          "SIREN : 985 169 473 (immatriculée au RNE le 16/06/2026)",
          "Code APE : 62.02A",
          "Siège : 3 rue des Rosiers, 86110 Craon (Vienne)",
          "TVA non applicable — article 293 B du CGI (franchise en base de TVA)",
          "Directeur de la publication : Willy Gauvrit",
          "Email : contact@workwave.fr — Site web : workwave.fr",
        ],
      },
    ],
  },
  {
    title: "Hébergement",
    blocks: [
      { p: "Le site est hébergé par **Vercel Inc.**, 440 N Baxter St, Coppell, TX 75019, États-Unis — [vercel.com](https://vercel.com)." },
    ],
  },
  {
    title: "Données personnelles et RGPD",
    blocks: [
      { p: "Les informations affichées sur les fiches professionnelles proviennent de sources publiques (registre Sirene de l'INSEE). Conformément au RGPD, tout professionnel peut demander la suppression de sa fiche via le lien prévu à cet effet en bas de chaque fiche." },
      { p: "**Responsable du traitement :** l'éditeur identifié ci-dessus (Workwave — Willy Gauvrit, entrepreneur individuel). Contact : contact@workwave.fr" },
      { p: "**Bases légales :** intérêt légitime (article 6.1.f du RGPD) pour le référencement des professionnels à partir de données publiques ; exécution du contrat et mesures précontractuelles (article 6.1.b du RGPD) pour la mise en relation demandée par le particulier qui dépose un projet." },
      { p: "**Durée de conservation :** les données des professionnels sont conservées pendant 3 ans à compter du dernier contact ; les données des projets déposés par les particuliers sont conservées 2 ans après la clôture du projet. Toute personne peut demander la suppression anticipée de ses données." },
      { p: "**Sous-traitants et prestataires :**" },
      {
        ul: [
          "**Vercel Inc.** (hébergement du site, États-Unis) — transfert encadré par les clauses contractuelles types (CCT).",
          "**Supabase** (hébergement de la base de données, région Union européenne).",
          "**Stripe Payments Europe, Ltd** (paiement en ligne des déblocages, Dublin, Irlande) — ne communique jamais les données bancaires complètes à l'éditeur. [Politique de confidentialité Stripe](https://stripe.com/fr/privacy).",
          "**Brevo (Sendinblue SAS)** (emails de prospection, 106 boulevard Haussmann, 75008 Paris). [Politique de confidentialité Brevo](https://www.brevo.com/fr/legal/privacypolicy/).",
          "**Resend, Inc.** (emails transactionnels : codes de vérification, notifications de projet et de lead, États-Unis) — transfert encadré par les CCT.",
          "**Anthropic, PBC** (qualification par intelligence artificielle des descriptions de projet, États-Unis) — transfert encadré par les CCT.",
        ],
      },
      { p: "**Transferts hors Union européenne :** certains prestataires (Vercel, Resend, Anthropic) sont établis aux États-Unis. Ces transferts sont encadrés par des garanties appropriées au sens des articles 44 et suivants du RGPD, notamment les clauses contractuelles types adoptées par la Commission européenne. Une copie de ces garanties est disponible sur demande à contact@workwave.fr." },
      { p: "**Vos droits :** conformément au RGPD, vous disposez des droits d'accès, de rectification, de suppression, d'opposition, de limitation du traitement et de portabilité de vos données. Pour les exercer, contactez contact@workwave.fr. En cas de litige, vous pouvez saisir la CNIL ([cnil.fr](https://www.cnil.fr))." },
    ],
  },
  {
    title: "Cookies et traceurs",
    blocks: [
      { p: "Le site utilise des cookies et traceurs. Les cookies strictement nécessaires au fonctionnement du site ne requièrent pas de consentement. Les traceurs non essentiels ne sont déposés qu'après votre **consentement**, recueilli via le bandeau de gestion des cookies :" },
      {
        ul: [
          "**Mesure d'audience — Google Analytics** (via Google Tag Manager) : statistiques de fréquentation du site.",
          "**Publicité — Microsoft Advertising (pixel UET)** : mesure de la performance des campagnes publicitaires.",
        ],
      },
      { p: "Vous pouvez à tout moment retirer votre consentement et modifier vos préférences via le lien de gestion des cookies présent sur le site." },
    ],
  },
  {
    title: "Prospection commerciale B2B",
    blocks: [
      { p: "Workwave peut adresser des communications commerciales par email aux professionnels dont les coordonnées sont accessibles publiquement (registre Sirene, sites web). Ces communications sont envoyées dans le cadre du régime de prospection B2B (article L34-5 du Code des postes et des communications électroniques), qui autorise la prospection par email auprès de professionnels sans consentement préalable, dès lors que le message est en rapport avec leur activité professionnelle." },
      { p: "Chaque email contient un lien de désinscription permettant de ne plus recevoir de communications de la campagne en cours, ainsi qu'un lien de désinscription globale permettant de ne plus jamais recevoir d'emails de Workwave." },
    ],
  },
  {
    title: "Propriété intellectuelle",
    blocks: [
      { p: "L'ensemble du contenu du site workwave.fr (textes, images, logos, design) est protégé par le droit de la propriété intellectuelle. Toute reproduction, même partielle, est interdite sans autorisation préalable." },
    ],
  },
];

export default function MentionsLegalesPage() {
  return (
    <>
      <JsonLd data={getOrganizationSchema(BASE_URL)} />
      <LegalDoc title="Mentions légales" sections={SECTIONS} />
    </>
  );
}
