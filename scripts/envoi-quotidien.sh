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
# JOURNALISER AVANT TOUT, y compris avant le cd.
# Les 14 et 15/08, aucun envoi n'est parti et le journal etait VIDE : macOS
# refuse a cron l'acces au dossier Bureau, le `cd` echouait, et le script
# sortait avant d'avoir ecrit quoi que ce soit. Un echec sans trace est pire
# qu'un echec bruyant : on croit que tout va bien.
JOURNAL=/tmp/envoi-quotidien.log
echo "===== $(date '+%Y-%m-%d %H:%M') demarrage =====" >> "$JOURNAL"

if ! cd /Users/willygauvrit/Desktop/Workwave-V2 2>/dev/null; then
  echo "  ECHEC : acces au dossier du projet refuse." >> "$JOURNAL"
  echo "  Cause probable : cron n'a pas l'Acces complet au disque sur macOS." >> "$JOURNAL"
  echo "  Reglages Systeme > Confidentialite > Acces complet au disque > ajouter /usr/sbin/cron" >> "$JOURNAL"
  exit 1
fi
export PATH="/Users/willygauvrit/.nvm/versions/node/v24.14.1/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"

if ! command -v npx >/dev/null 2>&1; then
  echo "  ECHEC : npx introuvable, envoi annule" >> "$JOURNAL"
  exit 1
fi

npx tsx scripts/envoi-prospection.ts --envoyer >> "$JOURNAL" 2>&1
echo "" >> "$JOURNAL"
