#!/bin/bash
# Capture la "vision Google" des 4 fiches temoins : titre, meta description,
# og/twitter, canonical, JSON-LD et texte visible. Sortie dans $1.
SORTIE="$1"
: > "$SORTIE"
for S in alternatif-ac-dc-continue-00011 go-renov-00026 garnier-renovation-00013 association-benny-marc-electric-97758; do
  echo "########## /artisan/$S" >> "$SORTIE"
  H=$(curl -s --max-time 120 "http://localhost:3000/artisan/$S")
  echo "$H" | python3 -c "
import sys,re,html
h=sys.stdin.read()
def m(p):
    r=re.findall(p,h,re.I|re.S)
    return [html.unescape(x).strip() for x in r]
print('TITRE :', *m(r'<title>(.*?)</title>'))
for n in ['description','og:title','og:description','twitter:title','twitter:description','robots']:
    print(f'{n} :', *m(r'<meta[^>]+(?:name|property)=\"'+re.escape(n)+r'\"[^>]+content=\"(.*?)\"'))
print('CANONICAL :', *m(r'<link[^>]+rel=\"canonical\"[^>]+href=\"(.*?)\"'))
for j in m(r'<script type=\"application/ld\+json\">(.*?)</script>'):
    print('JSONLD :', j[:400])
t=re.sub(r'<(script|style)[^>]*>.*?</\1>',' ',h,flags=re.S|re.I)
t=re.sub(r'<[^>]+>',' ',t); t=html.unescape(t); t=re.sub(r'\s+',' ',t).strip()
print('TEXTE :', t[:2500])
" >> "$SORTIE" 2>&1
done
wc -c "$SORTIE"
