import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const slugs = ["da-silva-almeida-ricardo-84694","cammisuli-fabio-70062","albert-jean-francois-05782","ac-environnement-00611","adeline-poulain-00029"];
  const { data } = await sb.from("pros").select("slug, id, categories(slug), cities(slug, departments(code, name))").in("slug", slugs);
  for (const p of (data as any[]) || []) {
    console.log(`${p.slug}  id=${p.id}  metier=${p.categories?.slug}  ville=${p.cities?.slug}  dept=${p.cities?.departments?.name}-${p.cities?.departments?.code}`);
  }
})();
