/** Redirections éditoriales existantes : destinations partagées avec le sitemap. */
export const BLOG_PRICE_REDIRECTS = [
{ source: "/blog/chaudiere-a-granules-a-la-rochelle-prix-maprimerenov-et-installation-2026", destination: "/guide-des-prix/prix-chaudiere-a-granules", permanent: true },
{ source: "/blog/isolation-des-combles-a-niort-tarifs-et-aides-financieres-en-2026", destination: "/guide-des-prix/prix-isolation-combles", permanent: true },
{ source: "/blog/isolation-thermique-a-perigueux-prix-au-m-et-aides-2026", destination: "/guide-des-prix/prix-isolation-combles", permanent: true },
{ source: "/blog/pompe-a-chaleur-a-pau-prix-aides-et-installateurs-rge-2026", destination: "/chauffagiste/prix", permanent: true },
{ source: "/blog/prix-au-m2-placoplatre-en-2026-pose-fourniture-fourchettes-completes-en-vienne-86", destination: "/guide-des-prix/prix-doublage-placo-m2", permanent: true },
{ source: "/blog/prix-construction-piscine-en-vienne-86-en-2026-coque-beton-monobloc-guide-complet", destination: "/pisciniste/prix", permanent: true },
{ source: "/blog/prix-creation-terrasse-bois-2026-tarif-au-m-en-vienne-86-bois-exotique-vs-composite", destination: "/guide-des-prix/prix-pose-terrasse-bois", permanent: true },
{ source: "/blog/prix-cuisine-sur-mesure-2026-cout-fourchettes-et-conseils-pour-economiser-en-vienne-86", destination: "/guide-des-prix/prix-cuisine", permanent: true },
{ source: "/blog/prix-debouchage-canalisation-2026-tarif-urgence-et-intervention-plombier-en-vienne", destination: "/guide-des-prix/prix-debouchage-canalisation-bouchee", permanent: true },
{ source: "/blog/prix-installation-alarme-et-videosurveillance-maison-2026-guide-complet-des-tarifs-en-vienne", destination: "/guide-des-prix/prix-installation-systeme-alarme", permanent: true },
{ source: "/blog/prix-isolation-exterieure-ite-en-2026-cout-au-m-et-aides-financieres-en-vienne", destination: "/facadier/prix", permanent: true },
{ source: "/blog/prix-nettoyage-bureaux-2026-en-vienne-86-tarifs-au-m-forfaits-mensuels-et-devis-detailles", destination: "/guide-des-prix/prix-service-nettoyage", permanent: true },
{ source: "/blog/prix-peinture-interieure-au-m-en-2026-tarifs-devis-types-et-astuces-en-vienne-86", destination: "/guide-des-prix/prix-pose-peinture", permanent: true },
{ source: "/blog/prix-poele-a-granules-en-2026-installation-maprimerenov-et-economies-d-energie", destination: "/guide-des-prix/prix-dinstallation-poele-a-granules", permanent: true },
{ source: "/blog/prix-pose-carrelage-au-m2-en-2026-sol-mur-salle-de-bain-toutes-fourchettes", destination: "/guide-des-prix/prix-pose-carrelage", permanent: true },
{ source: "/blog/prix-pose-porte-d-entree-2026-pvc-alu-bois-fourchettes-completes-dans-la-vienne", destination: "/menuisier/prix", permanent: true },
{ source: "/blog/prix-ramonage-cheminee-2026-tarifs-obligations-legales-et-astuces-en-vienne-86", destination: "/guide-des-prix/prix-ramonage-cheminee", permanent: true },
{ source: "/blog/prix-vitrier-urgence-2026-remplacement-vitre-cassee-devis-et-tarifs-en-vienne-86", destination: "/vitrier/prix", permanent: true },
{ source: "/blog/tarif-horaire-electricien-en-2026-prix-moyen-deplacement-et-facturation-en-vienne-86", destination: "/electricien/prix", permanent: true },
];

export const REDIRECTED_BLOG_PATHS = new Set(BLOG_PRICE_REDIRECTS.map(({ source }) => source));
