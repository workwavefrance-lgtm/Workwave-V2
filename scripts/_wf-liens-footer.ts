import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { generateDepartmentSlug } from "../lib/utils/slugs";
const sb = getServiceClient();
async function main() {
  const { data: cats } = await sb.from("categories").select("id, slug, vertical").order("name");
  const { data: deps } = await sb.from("departments").select("id, code, name").order("code");
  const ds = (deps as any[]).map((d) => generateDepartmentSlug(d as any));
  const pv = (v: string) => (cats as any[]).filter((c) => c.vertical === v);
  const out: string[] = [];
  for (const [v, off, n] of [["btp",0,9],["domicile",4,9],["personne",8,8]] as [string,number,number][])
    pv(v).slice(0, n).forEach((c, i) => out.push(`/${c.slug}/${ds[(i+off)%ds.length]}`));
  console.log(out.join("\n"));
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1);});
