"""
Extrait la forme juridique de CHAQUE entreprise de notre base, depuis le
fichier StockUniteLegale du repertoire Sirene (INSEE).

POURQUOI EN PYTHON ET PAS EN NODE. Le premier essai faisait defiler les 10 Go
du fichier dans Node : saturation memoire au bout de 30 millions de lignes.
Ici on lit en flux avec le module csv, et la seule chose gardee en memoire est
l'ensemble de nos SIREN (2,13 millions, environ 200 Mo). Le fichier n'est
jamais decompresse sur disque.

SORTIE : /tmp/sirene/formes.csv, deux colonnes siret,code_forme.
"""
import csv, subprocess, sys

SIRETS = "/tmp/sirene/nos-sirets.txt"
ZIP = "/tmp/sirene/unite.zip"
SORTIE = "/tmp/sirene/formes.csv"

# siren -> liste des sirets (une entreprise peut avoir plusieurs fiches)
par_siren = {}
for l in open(SIRETS):
    s = l.strip()
    if len(s) >= 9:
        par_siren.setdefault(s[:9], []).append(s)
print(f"nos SIREN distincts : {len(par_siren):,}".replace(",", " "), flush=True)

p = subprocess.Popen(["unzip", "-p", ZIP], stdout=subprocess.PIPE, text=True,
                     encoding="utf8", errors="replace", bufsize=1 << 20)
r = csv.reader(p.stdout)
entete = next(r)
iS = entete.index("siren")
iC = entete.index("categorieJuridiqueUniteLegale")

lues = ecrites = 0
with open(SORTIE, "w", encoding="utf8") as out:
    out.write("siret,forme\n")
    for row in r:
        lues += 1
        if lues % 5_000_000 == 0:
            print(f"   {lues//1_000_000} M lignes lues, {ecrites:,} correspondances".replace(",", " "), flush=True)
        if len(row) <= iC:
            continue
        sirets = par_siren.get(row[iS])
        if not sirets:
            continue
        cj = row[iC].strip()
        if not cj or cj == "0000":
            continue
        for s in sirets:
            out.write(f"{s},{cj}\n")
            ecrites += 1
p.stdout.close()
p.wait()
print(f"\ntermine : {lues:,} lignes lues, {ecrites:,} fiches avec une forme juridique".replace(",", " "))
