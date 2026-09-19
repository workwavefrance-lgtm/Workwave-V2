# Intégration publique — 19 septembre 2026

## Périmètre autorisé

Willy demande la publication de toute la refonte publique après vérification locale. Le plafond de cache est explicitement exclu de ce lot. Nettoyage, seuils, alertes, volumes et délais ISR existants ne sont pas modifiés. La sécurité de bascule et le retour arrière restent obligatoires.

## Application réelle

- Home : données réelles, deux entrées, projets anonymisés, trois profils avec photos provenant du stockage du site, FAQ et liens SEO conservés.
- Fiches : nouveau haut de page, photos, double action appel/dépôt et carte de contact. Les descriptions, registre, avis, catégories secondaires, galerie, guides et liens locaux existants sont conservés. Coordonnées selon les règles de rattachement ; établissement fermé sans bouton d’appel ; retraits inchangés.
- Dépôt : trois étapes, contexte métier/ville/spécialité et besoin transmis, retours conservés, erreurs proches des champs, action serveur existante. Prénom, consentement, prévention des doublons, qualification et notifications conservés. Téléphones français et belges acceptés.
- Annuaire, métier, ville/département, spécialité, guides et prix : présentation commune claire/verre appliquée aux modèles publics existants, avec maintien de leur structure de contenu et de leurs données réelles. Les pages HTML de démonstration ne sont pas des routes de production ; aucune nouvelle route générique /ville n’est créée.
- Blog : nouveau carnet branché sur tous les articles publiés et sa pagination. Corps des articles, auteurs, dates, sources et URL conservés.
- Pro : présentation de l’offre refaite, recherche d’entreprise réelle, accès aux formulaires retrouver/créer/réclamer existants ; connexion harmonisée. Vérification email et validation du rattachement inchangées.
- Conversion : attribution consentie de la page d’entrée au projet enregistré, sans coordonnées ni texte du besoin dans le suivi. Tableau par page dans les statistiques administrateur ; distinction des projets non attribués. Aucune reconstitution de l’historique de juillet.
- SEO : correctifs locaux du 19 septembre repris ; correction supplémentaire des liens fiche → guide métier (/{metier}/prix, et non /guide-des-prix/{metier}). Pas de changement massif des URL, sitemaps ou règles d’indexation.

## Recette avant publication

- 36 tests ciblés réussis : formulaire réel avec transports isolés (enregistrement, erreurs, doublons, notifications, multi-métiers), attribution, consentement, guides et droits de suppression.
- TypeScript réussi. Lint des nouveaux composants et points d’entrée modifiés : zéro erreur ni avertissement.
- Parcours navigateur réel jusqu’au récapitulatif et retour aux coordonnées vérifiés ; saisies conservées à l’écran. Aucun projet ni email de test envoyé en production.
- Contrôles visuels de la home, fiche, page locale, offre pro et dépôt ; fiche et dépôt à 390 px via aperçu local.
- Un premier build complet a compilé et passé TypeScript puis généré plus de 350 pages avant interruption volontaire de la seule construction locale : éviter un second calcul des sous-sitemaps inchangés après les dernières modifications.
- Build final local ciblé sur toutes les pages applicatives et API : réussi, 323 pages générées. Le Dockerfile de production reste en build complet, sans option de sélection de routes.
- Vérification HTTP de la version construite et résultat du déploiement : à compléter ci-dessous.

## Déploiement

Le premier contrôle serveur a réussi : environ 100 Gio libres, version actuelle saine, correctifs Coolify et image de retour arrière présents. À répéter immédiatement avant publication. Coolify déclenche automatiquement une construction sur push vers main : aucun push avant les derniers contrôles.

### Recette de la version construite

21 URL représentatives en HTTP 200, H1 unique, zéro lien vers une maquette HTML. Canoniques conservés pour les pages qui en possèdent ; noindex de la connexion conservé. Les guides liés depuis les fiches répondent désormais correctement. Variante fermée DECOLIVE 67 : 200, état fermé visible et aucun lien téléphone. Variante annuaire PEINTURES ROLAND HEITZ : 200, non réclamée, aucun lien téléphone. Fiche retirée Jean-Marc Sambin : 404 et noindex. Aucun retrait ou réactivation de données pendant ces vérifications.
