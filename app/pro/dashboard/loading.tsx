/**
 * Squelette de chargement du dashboard pro.
 *
 * POURQUOI : sans ce fichier, Next attendait que TOUTES les requêtes serveur du
 * layout ET de la page soient résolues avant d'afficher quoi que ce soit — soit
 * 1,5 à 3 s d'interface figée à chaque changement d'onglet sur mobile. Le pro
 * tapait, rien ne bougeait, il croyait que l'appli avait planté. Le shell
 * (sidebar, header, barre du bas) s'affiche désormais immédiatement et seul le
 * contenu est remplacé par ce squelette.
 *
 * SÉCURITÉ (leçon 18/04 sur le streaming Suspense) : un loading.tsx casse
 * notFound() et redirect() appelés DANS la page. Vérifié avant de l'ajouter :
 *   - aucune page sous /pro/dashboard n'utilise notFound() (leads/[id] rend un
 *     état "introuvable" en ligne) ;
 *   - les redirect() restants dans les pages sont inatteignables : le layout
 *     redirige déjà (pas de session / pas de fiche BTP) avant que la page ne
 *     soit rendue.
 */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden="true">
      {/* Titre */}
      <div className="h-7 w-52 rounded-lg bg-[var(--bg-secondary)]" />

      {/* Bandeau de stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--card-border)]"
          />
        ))}
      </div>

      {/* Liste de cartes */}
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--card-border)]"
          />
        ))}
      </div>
    </div>
  );
}
