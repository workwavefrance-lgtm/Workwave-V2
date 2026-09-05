import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb: any = getServiceClient();
const OUV = "etat_admin.is.null,etat_admin.neq.F";
async function compteCat(id: number): Promise<number | null> {
  for (let i = 0; i < 6; i++) {
    const { count, error } = await sb.from("pros").select("id", { count: "exact", head: true })
      .eq("category_id", id).eq("is_active", true).is("deleted_at", null).or(OUV);
    if (!error && count !== null) return count;
    await new Promise((r) => setTimeout(r, 4000));
  }
  return null;
}
(async () => {
  const slugs = ["electricien","plombier","macon","peintre","couvreur","menage","serrurier"];
  const { data: cats } = await sb.from("categories").select("id, slug").in("slug", slugs);
  for (const c of cats || []) {
    const n = await compteCat(c.id);
    console.log(`${c.slug} : ${n === null ? "ECHEC" : n} ouverts EN BASE`);
  }
  // fraicheur
  for (const [lib, iso] of [["24 h", new Date(Date.now()-86400e3).toISOString()], ["7 j", new Date(Date.now()-7*86400e3).toISOString()]]) {
    let n: number | null = null;
    for (let i = 0; i < 6 && n === null; i++) {
      const { count, error } = await sb.from("pros").select("id", { count: "exact", head: true })
        .eq("is_active", true).is("deleted_at", null).gt("updated_at", iso);
      if (!error && count !== null) n = count; else await new Promise((r) => setTimeout(r, 4000));
    }
    console.log(`fiches modifiees depuis ${lib} : ${n === null ? "ECHEC" : n}`);
  }
})();
