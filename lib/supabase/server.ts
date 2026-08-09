import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { fetchSupabase } from "./fetch-supabase";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Cf. lib/supabase/fetch-supabase.ts : empeche Next de dedoubler le corps
      // de chaque reponse (branche non lue retenue jusqu'au ramasse-miettes).
      global: { fetch: fetchSupabase },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component (lecture seule).
            // Ignoré si un middleware rafraîchit les sessions.
          }
        },
      },
    }
  );
}
