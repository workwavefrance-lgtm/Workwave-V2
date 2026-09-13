# Admin — intégration du design validé, 13 septembre 2026

Branche : `codex/admin-design-2026-09-13`. Travail local, sans push ni déploiement.

## Réalisé

- Thème clair limité à `.admin-shell` : fond doux, cartes arrondies, typographie système, titres noir/gris, actions orange, focus clavier et réduction des animations/transparences.
- Navigation commune conservant toutes les rubriques, avec vue d’ensemble, projets, support, statistiques et vigilance en accès principal. Barre mobile et navigation réduite sur ordinateur.
- Vue d’ensemble : vrais compteurs existants, actions à traiter et activité récente. Les périodes sont explicitées ; aucun chiffre fictif de la maquette n’entre dans l’application.
- Projets : tableau sur ordinateur, fiches sur téléphone ; recherche, filtre, export CSV, pagination, statut, budget, urgence, qualification, diffusion, déblocages et lien de détail conservés.
- Support : liste des tickets et conversation dans la même page ; sélection par `?ticket=ID`, recherche, filtres, pagination, contexte client, historique, notes internes, réponse email, brouillon IA et changements de statut conservés. Actions groupées de résolution/fermeture avec signalement des échecs.
- Brouillons maintenus en mémoire entre les tickets de la boîte, sans stockage navigateur. Un échec d’envoi conserve le texte. Une proposition IA ne remplace pas un brouillon existant. La saisie et le changement de ticket sont bloqués pendant un envoi ou une génération, pour éviter une réponse mélangée ou un brouillon effacé par une opération encore en cours. Le rechargement avertit s’il reste du texte ; quitter la boîte via la navigation interne n’assure pas sa conservation.
- Statistiques : présentation harmonisée, périodes et fraîcheur serveur visibles, explications regroupées dans un bloc dépliable. Les calculs, distinctions de sources et valeurs manquantes restent ceux du code existant.
- Vigilance : alertes et gravités existantes ; l’absence d’alerte est décrite comme le résultat des contrôles disponibles, sans promettre une santé globale du site.
- Composants communs : boutons, badges, tableaux, graphiques, infobulles et notifications adaptés au fond clair.

## Périmètre technique

Le layout authentifié et ses métadonnées `noindex` sont conservés. La page support vérifie aussi explicitement l’administrateur avant ses lectures avec le client de service. Les API, migrations, webhooks, crons, emails, règles métier et pages publiques ne sont pas modifiés. Aucun nouvel accès administrateur ni route de démonstration n’est ajouté à l’application.

Les rubriques secondaires utilisent le nouveau thème et conservent leur organisation et leurs actions actuelles. Cette livraison adapte l’interface ; elle ne constitue pas une validation de charge à 10 000 projets/jour. La capacité, les files de traitement, la fiabilité des métriques existantes et le stockage durable des brouillons restent des chantiers distincts.

## Vérifications

- TypeScript du projet : sans erreur (`npx tsc --noEmit --incremental false`).
- ESLint sur tous les fichiers TypeScript modifiés et le nouveau composant de titre : sans erreur.
- `git diff --check` : sans erreur.
- Contrôle visuel des composants réels dans un banc local isolé, avec données et requêtes simulées : support, vue d’ensemble, projets et vigilance ; ordinateur et téléphone 390 px. Navigation mobile vérifiée ; pas de débordement global sur téléphone.
- Support simulé : changement de ticket puis retour préserve le brouillon ; génération IA refusée si texte existant ; erreur d’envoi conserve le texte ; note et réponse appellent les chemins distincts ; succès vide le champ ; erreur de changement groupé conserve les tickets échoués pour réessayer ; résolution groupée et filtre Résolus vérifiés.
- Application Next locale, sans session : `/admin`, `/admin/support`, `/admin/projects`, `/admin/statistiques`, `/admin/alerts` renvoient 307 vers `/admin/login` ; `/api/admin/overview` renvoie 401 ; `/` et `/deposer-projet` renvoient 200.
- Aucun email réel, changement de ticket réel, opération en base ou déploiement n’a été réalisé pour ces tests.
- Build ciblé final : `NODE_OPTIONS=--max-old-space-size=6144 npx next build --debug-build-paths 'app/admin/**/page.tsx'` réussi (code 0), compilation, TypeScript et routes admin. Ce mode de vérification ne produit pas un build destiné à déployer tout le site.
- Build global : compilation et TypeScript réussis, génération interrompue volontairement à 352/415 après plusieurs minutes de progression très lente sur les pages publiques. Le build global complet n’est donc pas validé. Les premiers essais avaient rencontré la restriction réseau des polices Google puis le plafond mémoire Node ; la relance a utilisé 6 Go de heap.
- Vérification supplémentaire sur réponse simulée retardée : changement de ticket et saisie désactivés pendant l’envoi, puis disponibles après sa fin.


## Avant mise en ligne

Relire le diff de cette branche et le comparer au commit réellement déployé : sa branche de départ contenait déjà des correctifs antérieurs. Vérifier le parcours admin avec une session authentifiée sur une préproduction, notamment la réception/réponse email et les exports ; les tests locaux ci-dessus ne prouvent pas la livraison des emails. Utiliser le processus de déploiement contrôlé habituel avec vérifications de disponibilité, sans promettre zéro erreur de bascule.

Les maquettes validées restent dans `previews/workwave-glass` ; elles sont indépendantes de cette intégration.
