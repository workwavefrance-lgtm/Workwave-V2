import { google } from "googleapis";
import { execSync } from "child_process";
const BASE = "https://workwave.fr";
const URLS = ["/barometre-artisans", "/barometre-prix-artisans", "/barometre-metiers-artisans"].map((u) => BASE + u);
function code(u: string) { try { return execSync(`curl -s -o /dev/null -w "%{http_code}" -A Googlebot --max-time 15 "${u}"`, { encoding: "utf8" }).trim(); } catch { return "ERR"; } }
(async () => {
  const ok = URLS.filter((u) => { const c = code(u); console.log(c, u); return c === "200"; });
  if (!ok.length) return console.log("aucune 200");
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/indexing"] });
  const client = await auth.getClient();
  for (const url of ok) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = await (google.indexing("v3").urlNotifications as any).publish({ auth: client, requestBody: { url, type: "URL_UPDATED" } });
      console.log(r.status === 200 ? "✓ pingé" : "?", url);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) { console.log("✗", url, e?.errors?.[0]?.message || e?.message); }
  }
})();
