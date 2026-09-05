import os, sys, time, json, requests
from collections import defaultdict
K=None
for f in [".env.local","scraping/.env"]:
    try:
        for l in open(f):
            if l.startswith("INSEE_API_KEY"): K=l.split("=",1)[1].strip().strip('"').strip("'")
    except FileNotFoundError: pass
SB_URL=SB_KEY=None
for l in open(".env.local"):
    if l.startswith("NEXT_PUBLIC_SUPABASE_URL"): SB_URL=l.split("=",1)[1].strip().strip('"')
    if l.startswith("SUPABASE_SERVICE_ROLE_KEY"): SB_KEY=l.split("=",1)[1].strip().strip('"')
H={"apikey":SB_KEY,"Authorization":f"Bearer {SB_KEY}"}
S={"X-INSEE-Api-Key-Integration":K,"Accept":"application/json"}
URL="https://api.insee.fr/api-sirene/3.11/siret"

cats=requests.get(f"{SB_URL}/rest/v1/categories?select=slug,name,naf_codes&vertical=in.(btp,domicile,personne)",headers=H,timeout=60).json()
CIBLES=["electricien","plombier","macon","menuisier","carreleur","couvreur","peintre","chauffagiste"]
cats={c["slug"]:c for c in cats if c["slug"] in CIBLES}

DEPTS=[("75","Paris"),("13","Bouches-du-Rhone"),("69","Rhone"),("59","Nord"),("33","Gironde"),
       ("92","Hauts-de-Seine"),("93","Seine-Saint-Denis"),("31","Haute-Garonne"),("44","Loire-Atlantique"),
       ("06","Alpes-Maritimes"),("34","Herault"),("67","Bas-Rhin"),("38","Isere"),("35","Ille-et-Vilaine"),("86","Vienne")]

baro=requests.post(f"{SB_URL}/rest/v1/rpc/barometre_cat_dept",headers={**H,"Content-Type":"application/json"},data="{}",timeout=180).json()
enbase=defaultdict(int)
for r in baro: enbase[(r["c"],r["d"])]=r["n"]

def total_sirene(naf,dept):
    pre="20" if dept in ("2A","2B") else dept
    q=(f"periode(activitePrincipaleEtablissement:{naf[:2]}.{naf[2:]} AND etatAdministratifEtablissement:A) "
       f"AND codePostalEtablissement:[{pre}000 TO {pre}999]")
    for _ in range(3):
        r=requests.get(URL,params={"q":q,"nombre":1,"curseur":"*"},headers=S,timeout=60)
        if r.status_code==200: return r.json().get("header",{}).get("total",0)
        if r.status_code==404: return 0
        time.sleep(20)
    return None

print(f"\n  {'DEPARTEMENT':<20} {'METIER':<14} {'EN BASE':>8} {'REEL':>8} {'MANQUANT':>9}")
print("  " + "-"*64)
tb=tr=0
for code,nom in DEPTS:
    for slug in CIBLES:
        c=cats.get(slug)
        if not c or not c.get("naf_codes"): continue
        reel=0; ok=True
        for naf in c["naf_codes"]:
            t=total_sirene(naf,code); time.sleep(0.4)
            if t is None: ok=False; break
            reel+=t
        if not ok: continue
        b=enbase.get((slug,code),0); tb+=b; tr+=reel
        manque=max(0,reel-b)
        flag=" <<<" if manque>2000 else ""
        print(f"  {nom[:19]:<20} {slug:<14} {b:>8} {reel:>8} {manque:>9}{flag}")
    sys.stdout.flush()
print("  " + "-"*64)
print(f"  {'TOTAL echantillon':<35} {tb:>8} {tr:>8} {max(0,tr-tb):>9}")
print(f"\n  Taux de couverture actuel : {100*tb/tr:.1f} %" if tr else "")
