import { createClient } from "@supabase/supabase-js";
import { fetchSupabase } from "./fetch-supabase";

// Client Supabase pour les Server Components qui ne dependent PAS de la
// session utilisateur (pages publiques cachees, sitemaps, RSS, etc.).
//
// Pourquoi un client separe ?
// `lib/supabase/server.ts` utilise `cookies()` de `next/headers` pour
// gerer la session auth. Or des qu'une page touche aux cookies, Next.js
// la bascule en rendu DYNAMIQUE => ISR / cache CDN inactif.
//
// Pour les pages publiques (home, listings publics, etc.) on n'a pas
// besoin de la session : les donnees affichees (categories, villes,
// pros publics) sont identiques pour tout le monde. On utilise donc ce
// client "leger" qui ne touche pas aux cookies, ce qui permet a la page
// d'etre rendue en static / ISR et donc cachee par Vercel Edge.
//
// Securite : on utilise la cle anon (lecture seule sur les tables avec
// RLS public). Aucune donnee sensible n'est exposee.

// UNE SEULE INSTANCE, partagee par tout le serveur.
//
// Avant le 08/08/2026 cette fonction fabriquait un client NEUF a chaque appel.
// Il y a 57 appels repartis dans 21 fichiers (11 rien que dans les requetes
// pros) : une seule page en declenche donc plusieurs. Sous le crawl de Google
// (~670 pages/min), cela faisait des milliers de clients par minute.
//
// Or `createClient` n'est pas un objet leger : il instancie un client Postgrest,
// un client Auth, un client Realtime (avec ses minuteries de reconnexion), un
// client Storage et un client Functions. Rien ne les ferme. Mesure du 08/08 :
// l'application grossissait de ~120 Mo/min et saturait son tas en ~2 h.
//
// Partager l'instance est sans risque ICI, et c'est deja ce que fait
// `getAdminServiceClient` avec une cle bien plus sensible : ce client utilise
// la cle anon (identique pour tout le monde) et ne porte AUCUN etat par
// utilisateur — `persistSession: false` le garantit. C'est meme la raison
// d'etre de ce fichier : ne pas toucher a la session.
// `build()` existe pour que TypeScript garde le type EXACT retourne par
// createClient. Annoter la variable avec `ReturnType<typeof createClient>`
// ferait perdre les generiques et typerait toutes les tables en `never`.
function build() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Aucun token stocke : ce client ne represente aucun utilisateur,
        // ce qui est precisement ce qui permet de le partager.
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      // Empeche Next.js de dedoubler le corps de chaque reponse — la branche
      // non lue n'etait liberee que par le ramasse-miettes, d'ou 512 Mo
      // retenus sur un processus d'une heure. Cf. lib/supabase/fetch-supabase.ts.
      global: { fetch: fetchSupabase },
    }
  );
}

let publicClient: ReturnType<typeof build> | null = null;

export function createPublicClient() {
  if (!publicClient) publicClient = build();
  return publicClient;
}
