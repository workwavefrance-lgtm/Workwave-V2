import type { SeoContentBundle } from "./seo-sections";

export function debarrasContent(location: string, count: number): SeoContentBundle {
  return {
    sections: [
      {
        h2: `Faire débarrasser une maison ou un local ${location}`,
        paragraphs: [
          `Workwave référence ${count} entreprise${count === 1 ? "" : "s"} de débarras ${location}. Vérifiez sur chaque fiche les prestations proposées et la zone d'intervention avant de demander un devis.`,
          "Un débarras peut concerner une maison, un appartement, une cave, un grenier ou un local professionnel. Précisez ce qui doit être conservé, donné, valorisé ou évacué.",
        ],
      },
      {
        h2: "Préparer votre demande de débarras",
        paragraphs: ["Ces informations permettent au professionnel d'évaluer le travail nécessaire :"],
        bullets: ["Volume ou nombre de pièces à vider, avec des photos si possible.", "Étage, ascenseur, escaliers et accès pour le véhicule.", "Meubles lourds, objets fragiles et éventuels déchets nécessitant une prise en charge particulière.", "Date souhaitée et besoin de nettoyage après l'évacuation."],
      },
      {
        h2: "Ce qui fait varier le prix",
        paragraphs: ["Le prix dépend du volume à enlever, de l'accessibilité, du temps de manutention et du traitement des déchets. Demandez un devis écrit précisant le transport, le tri, l'évacuation et le nettoyage éventuel.", "La reprise d'objets valorisables peut être discutée avec l'entreprise. Elle ne rend pas automatiquement le débarras gratuit : faites préciser par écrit leur valeur et la somme restant à payer."],
      },
      {
        h2: "Choisir une entreprise et comparer les devis",
        paragraphs: ["Vérifiez l'identité de l'entreprise, son assurance et les prestations incluses. Demandez où seront orientés les objets réutilisables et les déchets, ainsi que les justificatifs disponibles.", "Le débarras n'est pas une prestation de ménage régulier. Ne présumez pas qu'un moyen de paiement particulier ou un avantage fiscal s'applique : demandez les conditions précises correspondant à votre prestation."],
      },
    ],
    faqs: [
      { question: `Comment demander un débarras ${location} ?`, answer: "Décrivez le lieu, le volume à évacuer, les accès et votre calendrier. Vous pourrez ensuite comparer les prestations et les devis des professionnels qui répondent." },
      { question: "Le nettoyage est-il compris ?", answer: "Il dépend du devis. Faites distinguer l'enlèvement des objets, le nettoyage et les éventuelles prestations spécialisées." },
      { question: "Un débarras peut-il être gratuit ?", answer: "Cela dépend notamment de la valeur des objets repris et du coût de l'intervention. Seul un devis de l'entreprise peut confirmer les conditions." },
    ],
  };
}
