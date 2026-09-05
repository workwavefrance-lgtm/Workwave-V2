import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getTopCities } from "../lib/queries/cities";
(async () => {
  for (const n of [300, 3000, 35163]) {
    const t0 = Date.now();
    const c = await getTopCities(n);
    console.log(`getTopCities(${n}) -> ${c.length} villes en ${Date.now()-t0} ms`);
  }
})().catch(e=>{console.error(e.message);process.exit(1);});
