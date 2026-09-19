<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Déploiements Workwave en production

Avant une mise en ligne, lire `docs/audits/2026-09-19-fiabilisation-deploiements.md`
et exécuter le contrôle serveur `/opt/workwave/deployment-preflight.py`.
Ne pas poursuivre si ce contrôle échoue. Vérifier la cible réellement servie après
la bascule : le statut « terminé » de Coolify ne suffit pas. Les correctifs Coolify
locaux doivent être réévalués après chaque mise à jour de Coolify. Ne pas réactiver
les anciens scripts qui arrêtent les conteneurs ou suppriment la route du proxy.
