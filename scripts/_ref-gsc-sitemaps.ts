import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";

async function main() {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  const sc = google.searchconsole({ version: "v1", auth: await auth.getClient() as any });
  const site = "https://workwave.fr/";

  const { data } = await sc.sitemaps.list({ siteUrl: site });
  const liste = data.sitemap || [];
  console.log("sitemaps connus de Google :", liste.length);
  for (const s of liste) {
    console.log("\npath:", s.path);
    console.log("  type:", s.type, "| isPending:", s.isPending, "| isSitemapsIndex:", s.isSitemapsIndex);
    console.log("  lastSubmitted:", s.lastSubmitted);
    console.log("  lastDownloaded:", s.lastDownloaded);
    console.log("  errors:", s.errors, "| warnings:", s.warnings);
    console.log("  contents:", JSON.stringify(s.contents));
  }
}
main().catch((e) => console.error("ERREUR:", e.message));
