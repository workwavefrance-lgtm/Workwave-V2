import { createClient } from "@supabase/supabase-js";
import { fetchSupabase } from "@/lib/supabase/fetch-supabase";

let serviceClient: ReturnType<typeof createClient> | null = null;

export function getAdminServiceClient() {
  if (!serviceClient) {
    serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      // Meme raison que pour le client public : sans signal, Next dedouble le
      // corps de chaque reponse et la branche non lue attend le ramasse-miettes.
      // Cf. lib/supabase/fetch-supabase.ts.
      { global: { fetch: fetchSupabase } }
    );
  }
  return serviceClient;
}
