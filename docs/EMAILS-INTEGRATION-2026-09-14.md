# Emails Workwave — intégration du 14 septembre 2026

Statut : code local prêt à relire, pas de push ni de déploiement. Aucun email réel ou campagne envoyé pendant cette intervention.

## Validation de fiche

`app/admin/(dashboard)/reclamations/actions.ts` déclenche déjà `sendClaimNotifications` après approbation effective de la RPC. Cette fonction appelle `sendClaimWelcomeEmail` pour le professionnel et une notification pour l’administration. Cela établit le déclenchement prévu, pas la livraison d’un message individuel : celle-ci se vérifie dans Resend.

Le nouveau mail annonce explicitement la validation et propose **Compléter ma fiche**, vers `/pro/dashboard/fiche`. Il indique qu’une connexion peut être nécessaire. Le code de vérification, envoyé avant cette décision, n’annonce pas une fiche validée. Un refus d’envoi du mail de bienvenue par Resend remonte maintenant une erreur au gestionnaire existant.

## Couverture

- Gabarit partagé : `lib/email/design.ts`, tables de présentation, styles inline, fond clair, titres noir/gris, bouton terre cuite, pré-en-tête et alternative texte avec liens.
- Modèles applicatifs Resend : vérification/réclamation/suppression, bienvenue pro, récupération de mot de passe, projets et relances BTP/AI, confirmation/retrait, avis/feedback, support, accès admin, paiement/essai historique AI et alertes administratives/techniques.
- Campagnes : `scripts/envoi-prospection.ts`, `scripts/annonce-2-offerts.ts`, `scripts/_mail-maintenance-pros.ts`, `scripts/_mail-enquete-groupeA.ts`. Elles ne sont pas exécutées. Les campagnes historiques doivent être relues et leur contexte/destinataires vérifiés avant une éventuelle relance ; leurs dates et filtres ne sont pas réactivés par ce travail.
- Les nombreux scripts ponctuels nominatifs archivés, les emails gérés directement par des fournisseurs externes et le PDF d’onboarding ne font pas partie de cette migration HTML. Les anciennes maquettes restent conservées.

Les destinataires, déclencheurs, pièces jointes, reply-to, headers de désinscription et clés d’idempotence sont conservés. Les emails entrants transférés gardent leur contenu d’origine. Les corps déjà enregistrés dans le journal de diffusion ne sont pas réécrits rétroactivement.

## Textes revus

- Validation claire, invitation à compléter la fiche, aucune promesse d’être déjà connecté.
- Pas de réponse du professionnel promise dans un délai non garanti.
- Solde offert réel dans les variantes de diffusion, distinction entre contact débloqué et chantier obtenu.
- Avis : note de 1 à 5, retour positif ou critique, pas de demande implicite de 5 étoiles ni de promesse de modération sous 24 h.
- Prospection : suppression des promesses « en un clic », « deux premiers chantiers gratuits » et de disponibilité permanente.
- Les notifications professionnelles de projets montrent les champs structurés et renvoient vers l’espace pour lire le texte libre, afin d’éviter de diffuser des coordonnées saisies dans ce texte.

## Vérification

- `node --import tsx scripts/preview-transactional-emails.ts` : 44 variantes produites à partir des vraies fonctions d’envoi ; Resend et Supabase simulés, réseau externe bloqué ; HTML inférieur à 7 Ko pour ces exemples.
- 21 tests réussis : rendu/échappement, code de suppression vs rattachement, bouton de configuration, refus Resend, liens privés et de désinscription, solde des offres, journal d’envoi/idempotence, règles de métiers.
- Contrôle mobile à 390 px de 12 variantes représentatives : aucun débordement horizontal ; vérification visuelle de la bienvenue et des modèles administratifs.
- ESLint ciblé sans erreur ni avertissement.
- Comparaison de 38 appels d’envoi avec la version précédente : destinataires, expéditeurs, reply-to, headers, pièces jointes et options d’envoi inchangés.
- TypeScript vérifié avec la configuration du projet, en excluant seulement deux doublons générés préexistants : `.next/types/cache-life.d 2.ts` et `.next/types/routes.d 2.ts`. La configuration normale du projet reste inchangée.
- Pas de build de production ni de test de livraison Gmail/Outlook réel. Les arrondis et détails de typographie peuvent différer selon le logiciel de messagerie ; contenu et actions utilisent une structure de repli en tableaux.

## Reprise

Galerie : `http://127.0.0.1:4181/`.

```sh
node --import tsx scripts/preview-transactional-emails.ts
python3 -m http.server 4181 --bind 127.0.0.1 --directory previews/transactional-emails
node --import tsx --test tests/email-design.test.ts tests/verification-email.test.ts tests/project-delivery.test.ts tests/btp-matching.test.ts
```

Avant diffusion en production : relire la galerie, déployer le code applicatif selon le procédé habituel, puis contrôler un envoi autorisé et sa livraison dans Resend. Les maquettes locales ne changent pas les mails actuellement envoyés par le serveur.
