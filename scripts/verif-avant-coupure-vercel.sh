#!/usr/bin/env bash
# Verifie que TOUT le trafic est bien passe sur le VPS avant de couper Vercel.
# A lancer juste avant la coupure :  bash scripts/verif-avant-coupure-vercel.sh
#
# Feu VERT = plus aucun visiteur n'atteint Vercel, la coupure est sans risque.

VPS="72.60.130.5"
VERCEL="216.198.79.1"
ok=1

echo ""
echo "  VERIFICATION AVANT COUPURE DE VERCEL"
echo "  $(date '+%d/%m/%Y %H:%M')"
echo ""

echo "  1. Resolveurs publics dans le monde"
for d in 8.8.8.8 1.1.1.1 9.9.9.9 208.67.222.222 8.26.56.26 77.88.8.8; do
  r=$(dig +short +time=3 +tries=1 A workwave.fr @"$d" 2>/dev/null | head -1)
  if [ "$r" = "$VPS" ]; then
    printf "     OK   %-16s %s\n" "$d" "$r"
  elif [ -z "$r" ]; then
    printf "     --   %-16s (pas de reponse)\n" "$d"
  else
    printf "     NON  %-16s %s  <-- encore Vercel\n" "$d" "$r"; ok=0
  fi
done

echo ""
echo "  2. Ta propre machine"
ip=$(curl -s -o /dev/null -w "%{remote_ip}" https://workwave.fr/ --max-time 20 2>/dev/null)
if [ "$ip" = "$VPS" ]; then
  echo "     OK   ta machine atteint le VPS ($ip)"
else
  echo "     NON  ta machine atteint encore $ip"; ok=0
fi

echo ""
echo "  3. Le site repond correctement sur le VPS"
for p in "/" "/plombier/vienne-86" "/deposer-projet" "/pro/reclamer/atsaf-00001"; do
  c=$(curl -s -o /dev/null -w "%{http_code}" --resolve "workwave.fr:443:$VPS" "https://workwave.fr$p" --max-time 25)
  case "$c" in
    200|404) printf "     OK   %s  %s\n" "$c" "$p" ;;
    *) printf "     NON  %s  %s\n" "$c" "$p"; ok=0 ;;
  esac
done

echo ""
echo "  4. Certificat HTTPS"
s=$(curl -s -o /dev/null -w "%{ssl_verify_result}" --resolve "workwave.fr:443:$VPS" https://workwave.fr/ --max-time 25 2>/dev/null)
[ "$s" = "0" ] && echo "     OK   certificat valide" || { echo "     NON  certificat invalide (code $s)"; ok=0; }

echo ""
if [ "$ok" = "1" ]; then
  echo "  ============================================"
  echo "   FEU VERT — tu peux couper Vercel sans risque"
  echo "  ============================================"
else
  echo "  ============================================"
  echo "   ATTENDS — des visiteurs passent encore par Vercel"
  echo "   Relance ce script dans 1 heure."
  echo "  ============================================"
fi
echo ""
