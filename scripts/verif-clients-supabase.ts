/**
 * GARDE-FOU : aucun client Supabase fabrique a la main cote serveur.
 *
 * POURQUOI CE SCRIPT EXISTE (09/08/2026)
 * Un client Supabase cree avec `createClient(url, cle)` SANS options a
 * `autoRefreshToken` actif par defaut : il lance une minuterie de 30 s qui
 * n'est jamais arretee, et une minuterie vivante rend son client impossible a
 * liberer. Il reste en memoire jusqu'a la mort du processus.
 *
 * Banc d'essai (3 000 creations dans un contexte de rendu) :
 *     sans options                    : 29,0 Mo retenus
 *     avec autoRefreshToken desactive :  0,2 Mo retenus
 *
 * Le bug a ete corrige DEUX FOIS a deux mois d'ecart :
 *   - 08/08 dans lib/supabase/public-client.ts (memoisation)
 *   - 09/08 dans 37 autres fichiers, dont components/pro/ProGuidesLinks.tsx
 *     rendu sur CHAQUE fiche pro, la route la plus crawlee du site.
 *
 * Il reviendra une troisieme fois si rien ne le surveille : ecrire
 * `createClient(url, cle)` est le geste naturel quand on a besoin d'acceder a
 * la base dans un nouveau fichier. D'ou ce controle.
 *
 * LA REGLE
 *   lecture publique  -> createPublicClient()   (lib/supabase/public-client)
 *   cle de service    -> getServiceClient()     (lib/supabase/service-client)
 *   session utilisateur -> createClient() de lib/supabase/server (avec cookies)
 * Jamais de `createClient(...)` ecrit a la main dans un fichier applicatif.
 *
 * USAGE
 *   npx tsx scripts/verif-clients-supabase.ts     # sortie 1 si violation
 *
 * A LANCER avant chaque commit qui touche a l'acces base, et en pre-deploiement.
 */
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";

// Les seuls fichiers autorises a appeler createClient de @supabase/supabase-js :
// ce sont eux qui posent les bonnes options une fois pour toutes.
const MODULES_CANONIQUES = new Set([
  "lib/supabase/public-client.ts",
  "lib/supabase/service-client.ts",
  "lib/supabase/server.ts",
  "lib/supabase/client.ts",
  "lib/admin/service-client.ts",
]);

const DOSSIERS = ["app", "lib", "components"];
const RACINE = process.cwd();

function parcourir(dir: string, sortie: string[] = []): string[] {
  for (const nom of readdirSync(dir)) {
    const complet = path.join(dir, nom);
    if (statSync(complet).isDirectory()) {
      if (nom === "node_modules" || nom === ".next") continue;
      parcourir(complet, sortie);
    } else if (/\.(ts|tsx)$/.test(nom)) {
      sortie.push(complet);
    }
  }
  return sortie;
}

type Violation = { fichier: string; ligne: number; extrait: string; raison: string };

const violations: Violation[] = [];

for (const d of DOSSIERS) {
  const dossier = path.join(RACINE, d);
  try { statSync(dossier); } catch { continue; }
  for (const complet of parcourir(dossier)) {
    const relatif = path.relative(RACINE, complet);
    if (MODULES_CANONIQUES.has(relatif)) continue;

    const contenu = readFileSync(complet, "utf8");

    // Les composants navigateur ne sont pas concernes : pas de processus long,
    // et le client y est legitime (lib/supabase/client.ts).
    const debut = contenu.slice(0, 200);
    if (/^\s*["']use client["']/m.test(debut)) continue;

    // On ne cible QUE l'import direct du SDK. Les helpers canoniques importes
    // (createPublicClient, getServiceClient, createClient de lib/supabase/server)
    // sont exactement ce qu'on veut voir.
    const importSdk = contenu.match(
      /import\s*\{([^}]*)\}\s*from\s*["']@supabase\/supabase-js["']/
    );
    if (!importSdk) continue;

    // Sous quel NOM le SDK est-il importe ici ? Beaucoup de fichiers font
    // `import { createClient as createServiceClient }` tout en important AUSSI
    // `createClient` de lib/supabase/server (le client de session, legitime).
    // Sans distinguer les deux, on signale a tort les appels legitimes :
    // 19 faux positifs a la premiere version de ce script.
    const alias = [...importSdk[1].matchAll(/createClient(?:\s+as\s+(\w+))?/g)]
      .map((m) => m[1] || "createClient");
    if (alias.length === 0) continue;
    const appelSdk = new RegExp(`\\b(${alias.join("|")})\\s*\\(`);

    const lignes = contenu.split("\n");
    lignes.forEach((l, i) => {
      if (!appelSdk.test(l)) return;
      if (/^\s*(\/\/|\*)/.test(l)) return; // commentaire
      // Un createClient QUI POSE ses options auth est tolere s'il desactive
      // explicitement le rafraichissement, mais on le signale quand meme en
      // avertissement, car il duplique un module canonique.
      const contexte = lignes.slice(i, i + 12).join("\n");
      const sansMinuterie = /autoRefreshToken\s*:\s*false/.test(contexte);
      violations.push({
        fichier: relatif,
        ligne: i + 1,
        extrait: l.trim().slice(0, 90),
        raison: sansMinuterie
          ? "duplique un module canonique (minuterie desactivee, mais client non partage)"
          : "MINUTERIE ACTIVE : ce client ne sera JAMAIS libere",
      });
    });
  }
}

const graves = violations.filter((v) => v.raison.startsWith("MINUTERIE"));

if (violations.length === 0) {
  console.log("OK : aucun client Supabase fabrique a la main cote serveur.");
  process.exit(0);
}

console.log(`${violations.length} client(s) Supabase fabrique(s) a la main cote serveur :\n`);
for (const v of violations) {
  console.log(`  ${v.fichier}:${v.ligne}`);
  console.log(`      ${v.extrait}`);
  console.log(`      -> ${v.raison}\n`);
}
console.log("A REMPLACER PAR :");
console.log("  lecture publique    : createPublicClient()  (@/lib/supabase/public-client)");
console.log("  cle de service      : getServiceClient()    (@/lib/supabase/service-client)");
console.log("  session utilisateur : createClient()        (@/lib/supabase/server)");

process.exit(graves.length > 0 ? 1 : 0);
