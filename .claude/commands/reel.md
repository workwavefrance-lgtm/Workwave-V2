---
description: Génère un reel projet Workwave (vidéo Instagram) + la légende, à partir d'un email de nouveau projet
---

Tu génères UN REEL VIDÉO INSTAGRAM pour un projet Workwave, + sa légende Insta. RIEN D'AUTRE.

## ⛔ GARDE-FOUS ABSOLUS (ne JAMAIS faire, même si tu penses que ce serait utile)
- ❌ N'ENVOIE AUCUN EMAIL (ni au client, ni aux pros).
- ❌ NE MODIFIE PAS la base Supabase (aucune recatégorisation, aucun update, aucun insert).
- ❌ NE CONTACTE PERSONNE, ne fais AUCUN « matching artisans », AUCUNE « notification client ».
- ❌ N'INVENTE PAS un « workflow de traitement de lead » — il n'existe pas. Les projets sont broadcastés aux pros AUTOMATIQUEMENT côté serveur ; le travail manuel de Willy = juste le reel + la légende.
- ❌ ZÉRO PII du client dans le reel ET la légende : prénom au maximum, JAMAIS nom complet / téléphone / email / nom du chien, etc.

Ta seule mission = produire le .mp4 sur le Bureau + la légende Insta dans le chat.

## Données d'entrée
`$ARGUMENTS` (ou l'email de projet collé juste avant). Extrais : métier, ville, département, urgence, budget, description du chantier, et le THÈME demandé (« noir » = dark, « blanc » = light ; défaut = dark pour la France). Si c'est un projet en BELGIQUE, ajoute `"country": "BE"` (drapeau belge auto).

## Étapes exactes

1. **Crée le JSON** `marketing/projets/<slug>.json` (slug = métier-ville en kebab-case, sans accents), format :
   ```json
   {
     "slug": "depannage-electromenager-coggia",
     "theme": "light",
     "metier": "Dépannage électroménager",
     "ville": "Coggia",
     "dept": "Corse-du-Sud (2A)",
     "zone": "Coggia (2A)",
     "budget": "À définir",
     "urgence": "Cette semaine",
     "description": "Reformulation courte du chantier, sans PII."
   }
   ```
   - `theme`: `"light"` pour blanc, `"dark"` pour noir.
   - `budget`: reformate (« Je ne sais pas » → « À définir » ; « Moins de 500 € », « 500 € – 2 000 € », « Plus de 15 000 € »…).
   - Belgique : ajoute `"country": "BE"`.

2. **Rends la vidéo** (le template a besoin du serveur local sur le port 8877) :
   ```bash
   cd /Users/willygauvrit/Desktop/Workwave-V2
   python3 -m http.server 8877 --directory marketing >/dev/null 2>&1 &
   SRV=$!; trap "kill $SRV 2>/dev/null" EXIT; sleep 1
   node scripts/render-reel-projet.mjs marketing/projets/<slug>.json
   ffmpeg -y -framerate 30 -i marketing/frames-projet/f%05d.png -c:v libx264 -pix_fmt yuv420p -movflags +faststart "marketing/Workwave-projet-<slug>.mp4" >/dev/null 2>&1
   cp "marketing/Workwave-projet-<slug>.mp4" ~/Desktop/
   ls -lh ~/Desktop/Workwave-projet-<slug>.mp4
   ```

3. **Donne la légende Insta** dans le chat (bloc copiable), selon la mémoire `reel-projet-legende-insta` :
   - Hook 1ʳᵉ ligne qui parle à l'artisan (« [Métier] dans [dept] ? Un chantier vous attend près de chez vous. »)
   - 1 ligne sur le besoin (sans PII)
   - 📍 ville (dept) · ⏳ urgence · 💰 budget · 🛠️ nature du chantier
   - Ligne offre OBLIGATOIRE : « Sur Workwave, tu vois le projet AVANT de payer. 9,90 € le contact, 0 abonnement, 0 commission — tes 2 premiers offerts. »
   - CTA « 👉 Débloque ce client sur workwave.fr/pro (lien en bio) »
   - **5 hashtags MAX** : #métier #niche #ville #département #workwavefr (minuscules, sans accents)
   - Belgique : « partout en Belgique », dept→province, BCE au lieu de SIRET si pertinent.

4. **Récap** : confirme le chemin du .mp4 sur le Bureau + le thème utilisé.

Fin. Aucune autre action.
