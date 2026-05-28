#!/bin/bash
# Cron quotidien Workwave : 02h00 chaque matin (apres reset Resend + Google).
#
# Tache 1 : Envoie 95 mails cold via Resend (free tier 100/jour, marge 5)
# Tache 2 : Ping 200 nouvelles URLs /ai/freelance/* via Google Indexing API
#
# Idempotence : les 2 scripts maintiennent un .json de tracking, donc relancer
# le cron multiple fois dans la journee ne re-envoie pas, ne re-ping pas.
#
# Pre-requis :
#   - .env.local present a la racine du projet (env vars Resend, Supabase)
#   - gcloud ADC configure (cf. lecon CLAUDE.md 29/04/2026)
#
# Logs : /tmp/workwave-cron-YYYY-MM-DD.log

set -e

# Repertoire du projet (resolu absolu pour cron)
PROJECT_DIR="/Users/willygauvrit/Desktop/Workwave-V2"
cd "$PROJECT_DIR" || exit 1

# PATH minimal pour que npx/gcloud/node soient trouvables sous cron
export PATH="/Users/willygauvrit/.nvm/versions/node/v24.14.1/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

# Log file dated
LOG_FILE="/tmp/workwave-cron-$(date +%Y-%m-%d).log"
exec >> "$LOG_FILE" 2>&1

echo ""
echo "=== Workwave cron $(date '+%Y-%m-%d %H:%M:%S') ==="

echo ""
echo "--- Tache 1 : Pre-warm sitemap cache (avant que Google fetch) ---"
npx tsx scripts/_warm-sitemap-cache.ts || echo "Sitemap warm failed (continuing)"

echo ""
echo "--- Tache 2 : Mass cold mail (95 mails/jour) ---"
npx tsx scripts/_mass-cold-may28.ts || echo "Mass cold failed (continuing)"

echo ""
echo "--- Tache 3 : Ping Google Indexing AI (200 URLs/jour) ---"
npx tsx scripts/ping-google-indexing-ai-freelances.ts || echo "Ping Google failed (continuing)"

echo ""
echo "=== Fin cron $(date '+%Y-%m-%d %H:%M:%S') ==="
