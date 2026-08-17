import { createClient } from "@supabase/supabase-js";
import { fetchSupabase } from "./fetch-supabase";

/**
 * LE client Supabase a cle de service, partage par tout le serveur.
 *
 * POURQUOI CE FICHIER EXISTE (mesure le 09/08/2026)
 *
 * Le depot fabriquait des clients Supabase a 84 endroits differents, presque
 * tous avec `createClient(url, cle)` sans aucune option. Or par defaut,
 * `autoRefreshToken` est ACTIF : chaque client lance une minuterie de 30 s qui
 * n'est jamais arretee. Une minuterie vivante rend son client impossible a
 * liberer : il reste en memoire pour toute la duree du processus.
 *
 * Banc d'essai local, 3 000 creations dans un contexte de rendu :
 *
 *     client sans options (comportement d'avant) : 29,0 Mo retenus
 *     avec autoRefreshToken desactive            :  0,2 Mo retenus
 *
 * Soit ~8,7 Ko retenus DEFINITIVEMENT par client cree, verifie stable quelle
 * que soit la taille de la page rendue autour (donc c'est bien le client qui
 * est retenu, pas le contexte du rendu).
 *
 * C'est exactement le bug corrige le 08/08 dans `public-client.ts`. Il restait
 * partout ailleurs, notamment dans `components/pro/ProGuidesLinks.tsx`, rendu
 * sur CHAQUE fiche pro, la route la plus crawlee du site.
 *
 * Trois protections, toutes necessaires :
 *   - une seule instance partagee (pas un client neuf par appel) ;
 *   - `autoRefreshToken: false` : aucune minuterie, donc rien qui epingle ;
 *   - `fetch: fetchSupabase` : pas de dedoublement des reponses par Next
 *     (cf. lib/supabase/fetch-supabase.ts).
 *
 * SECURITE : ce client utilise la cle de service, qui contourne les regles
 * d'acces (RLS). Ne l'utiliser QUE cote serveur, jamais dans un composant
 * "use client". Pour les lectures publiques, prefer `createPublicClient()`.
 */
function build() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        // Ce client ne represente aucun utilisateur : rien a rafraichir, donc
        // aucune minuterie. C'est CE reglage qui supprime la retention.
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: { fetch: fetchSupabase },
    }
  );
}

// `build()` existe pour que TypeScript garde le type EXACT retourne par
// createClient : annoter avec `ReturnType<typeof createClient>` ferait perdre
// les generiques et typerait toutes les tables en `never`.
let serviceClient: ReturnType<typeof build> | null = null;

export function getServiceClient() {
  if (!serviceClient) serviceClient = build();
  return serviceClient;
}
