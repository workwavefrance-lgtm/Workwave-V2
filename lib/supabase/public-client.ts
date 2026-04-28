import { createClient } from "@supabase/supabase-js";

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

export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // On force la non-persistance : ce client est instancie par
        // requete cote serveur, il n'a aucune raison de stocker un token.
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}
