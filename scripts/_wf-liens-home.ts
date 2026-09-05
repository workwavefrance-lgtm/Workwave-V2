import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { generateDepartmentSlug } from "../lib/utils/slugs";
const sb = getServiceClient();
async function main() {
  const { data: cats } = await sb.from("categories").select("id, slug, vertical").order("name");
  const { data: deps } = await sb.from("departments").select("id, code, name").order("code");
  const departments = deps as any[];
  const deptSlugs = departments.map((d) => generateDepartmentSlug(d as any));
  const pv = (v: string) => (cats as any[]).filter((c) => c.vertical === v);
  const out: string[] = [];
  for (const [v, off] of [["btp",0],["domicile",4],["personne",8]] as [string,number][])
    pv(v).forEach((c, i) => out.push(`/${c.slug}/${deptSlugs[(i+off)%deptSlugs.length]}`));
  console.log(out.join("\n"));
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1);});
