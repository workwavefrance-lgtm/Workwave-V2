#!/bin/bash
# Passage quotidien de prospection Workwave.
#
# Plafonne a 70 envois par jour : le plan Resend gratuit en autorise 100 et ce
# quota est PARTAGE avec les emails du site (codes de verification de
# reclamation, diffusion des chantiers aux pros). On en laisse 30 au site.
#
# Idempotent : chaque envoi ecrit une trace en base, donc aucun doublon et
# aucun oubli, meme si le Mac est eteint plusieurs jours.
#
# PATH : node est installe via nvm, donc absent du PATH minimal de cron. Le
# chemin est ecrit en dur ici (constate le 12/08 : "npx: command not found").
cd /Users/willygauvrit/Desktop/Workwave-V2 || exit 1
export PATH="/Users/willygauvrit/.nvm/versions/node/v24.14.1/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"

if ! command -v npx >/dev/null 2>&1; then
  echo "$(date '+%Y-%m-%d %H:%M') ERREUR : npx introuvable, envoi annule" >> /tmp/envoi-quotidien.log
  exit 1
fi

echo "===== $(date '+%Y-%m-%d %H:%M') =====" >> /tmp/envoi-quotidien.log
npx tsx scripts/envoi-prospection.ts --envoyer >> /tmp/envoi-quotidien.log 2>&1
echo "" >> /tmp/envoi-quotidien.log
