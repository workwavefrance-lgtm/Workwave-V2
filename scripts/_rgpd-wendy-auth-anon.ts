/** RGPD Wendy Rimpault : le hard-delete du compte auth a échoué (FK). On anonymise
 *  l'email + on bannit le compte (retrait de la PII + compte inutilisable). */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const USER_ID = "8573c1d7-1834-4d40-a801-dda40c478514";

(async () => {
  // 1) retenter un SOFT delete (marque deleted_at côté auth, ne casse pas les FK)
  const soft = await supabase.auth.admin.deleteUser(USER_ID, true);
  console.log(soft.error ? `soft-delete KO : ${soft.error.message}` : "✓ compte auth soft-deleted");

  // 2) anonymiser l'email + bannir (retrait PII + connexion impossible)
  const anon = `deleted-${USER_ID}@workwave.invalid`;
  const { data, error } = await supabase.auth.admin.updateUserById(USER_ID, {
    email: anon,
    ban_duration: "876000h", // ~100 ans
    user_metadata: {},
    app_metadata: {},
  });
  if (error) {
    console.log(`✗ anonymisation KO : ${error.message}`);
    console.log("→ À faire manuellement : Supabase Dashboard → Authentication → cet utilisateur → Delete user.");
  } else {
    console.log(`✓ compte anonymisé (email → ${anon}) + banni 100 ans`);
  }

  // 3) vérif finale
  const { data: check } = await supabase.auth.admin.getUserById(USER_ID);
  console.log("État final compte :", JSON.stringify({
    email: check?.user?.email,
    banned_until: (check?.user as any)?.banned_until ?? null,
    deleted_at: (check?.user as any)?.deleted_at ?? null,
  }));
})();
