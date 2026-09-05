import time, requests, sys
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

cats={c["slug"]:c for c in requests.get(f"{SB_URL}/rest/v1/categories?select=slug,name,naf_codes&vertical=in.(btp,domicile,personne)",headers=H,timeout=60).json()}
baro=requests.post(f"{SB_URL}/rest/v1/rpc/barometre_cat_dept",headers={**H,"Content-Type":"application/json"},data="{}",timeout=180).json()

SEUIL=850
suspects=[r for r in baro if r["n"]>=SEUIL]
surs=sum(r["n"] for r in baro if r["n"]<SEUIL)
print(f"  {len(baro)} combinaisons au total")
print(f"  {len(suspects)} suspectes de troncature (>= {SEUIL} pros)")
print(f"  {len(baro)-len(suspects)} completes, soit {surs:,} pros deja tous la\n".replace(","," "))
sys.stdout.flush()

def total(naf,dept):
    pre="20" if dept in ("2A","2B") else dept
    q=(f"periode(activitePrincipaleEtablissement:{naf[:2]}.{naf[2:]} AND etatAdministratifEtablissement:A) "
       f"AND codePostalEtablissement:[{pre}000 TO {pre}999]")
    for _ in range(3):
        r=requests.get(URL,params={"q":q,"nombre":1,"curseur":"*"},headers=S,timeout=60)
        if r.status_code==200: return r.json().get("header",{}).get("total",0)
        if r.status_code==404: return 0
        time.sleep(20)
    return None

base=reel=0; fait=0; parmetier=defaultdict(lambda:[0,0]); pardept=defaultdict(lambda:[0,0])
for r in suspects:
    c=cats.get(r["c"])
    if not c or not c.get("naf_codes"): continue
    t=0; ok=True
    for naf in c["naf_codes"]:
        v=total(naf,r["d"]); time.sleep(0.35)
        if v is None: ok=False; break
        t+=v
    if not ok: continue
    base+=r["n"]; reel+=t; fait+=1
    parmetier[r["c"]][0]+=r["n"]; parmetier[r["c"]][1]+=t
    pardept[r["d"]][0]+=r["n"];  pardept[r["d"]][1]+=t
    if fait%100==0: print(f"    {fait}/{len(suspects)}  cumul manquant : {reel-base:,}".replace(","," ")); sys.stdout.flush()

print(f"\n  === RESULTAT sur les {fait} combinaisons tronquees ===")
print(f"  en base : {base:,}".replace(","," "))
print(f"  reel    : {reel:,}".replace(","," "))
print(f"  MANQUE  : {reel-base:,}".replace(","," "))
print(f"\n  Top 12 metiers par manque :")
for k,(b,t) in sorted(parmetier.items(), key=lambda x:-(x[1][1]-x[1][0]))[:12]:
    print(f"    {k:<22} {b:>7} -> {t:>8}   manque {t-b:>8}")
print(f"\n  Top 12 departements par manque :")
for k,(b,t) in sorted(pardept.items(), key=lambda x:-(x[1][1]-x[1][0]))[:12]:
    print(f"    {k:<4} {b:>7} -> {t:>8}   manque {t-b:>8}")
