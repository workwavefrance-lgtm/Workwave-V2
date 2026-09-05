import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { data: bornes } = await sb.from("pros").select("id").order("id", { ascending: false }).limit(1);
  const maxId = bornes?.[0]?.id ?? 0;
  console.log(`id max = ${maxId}`);
  // 8 tranches reparties : ce que vaudrait un lastmod "reel" par lot
  const pas = Math.floor(maxId / 8);
  for (let i = 0; i < 8; i++) {
    const a = i * pas, b = (i + 1) * pas;
    const t0 = Date.now();
    const { data, error } = await sb.from("pros").select("updated_at")
      .eq("is_active", true).is("deleted_at", null)
      .gte("id", a).lt("id", b)
      .order("updated_at", { ascending: false }).limit(1)
      .abortSignal(AbortSignal.timeout(120000));
    console.log(`lot id ${a}-${b}  max(updated_at)=${data?.[0]?.updated_at?.slice(0,10) ?? "ERREUR:" + error?.message?.slice(0,60)}  (${Date.now() - t0} ms)`);
  }
})();
