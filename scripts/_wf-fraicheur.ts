import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb: any = getServiceClient();
(async () => {
  for (const [lib, iso] of [["24 h", new Date(Date.now()-86400e3).toISOString()], ["7 jours", new Date(Date.now()-7*86400e3).toISOString()]]) {
    const { count, error } = await sb.from("pros").select("id", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null).gt("updated_at", iso);
    console.log(`fiches updated_at < ${lib} : ${error ? "ERREUR " + error.message : count}`);
  }
  // les 10 plus recentes, pour voir ce que le flux fraicheur sert
  const { data } = await sb.from("pros").select("slug, name, updated_at, created_at")
    .eq("is_active", true).is("deleted_at", null).order("updated_at", { ascending: false }).limit(6);
  for (const p of data || []) console.log(`  ${p.updated_at} | cree ${p.created_at} | ${p.slug}`);
})();
