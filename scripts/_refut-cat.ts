import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { data } = await sb.from("categories").select("id,slug,vertical");
  const btp = (data || []).filter((c: any) => ["btp", "domicile", "personne"].includes(c.vertical));
  console.log("categories BTP/domicile/personne :", btp.length);
  console.log("categories tech :", (data || []).filter((c: any) => c.vertical === "tech").length);
  for (const s of ["psychopraticien", "coach-sportif", "naturopathe", "montage-meubles"]) {
    const c = (data || []).find((x: any) => x.slug === s);
    console.log(`  ${s} -> ${c ? "vertical=" + c.vertical : "ABSENT en base"}`);
  }
})();
