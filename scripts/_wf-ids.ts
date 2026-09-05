import { tousLesIdsDeSitemap, NB_SITEMAPS_PROS, NB_SITEMAPS_PROS_AI, NB_SITEMAPS_CAT_CITY } from "../lib/seo/sitemap-ids";
const ids = tousLesIdsDeSitemap();
console.log("nb ids declares :", ids.length);
console.log("min/max :", Math.min(...ids), Math.max(...ids));
const btp = ids.filter((i) => i >= 100 && i < 200);
const ai = ids.filter((i) => i >= 200);
console.log(`tel que le cron sitemap-audit les lit : BTP=${btp.length} (dernier ${Math.max(...btp)}) | "AI"=${ai.length} (dernier ${Math.max(...ai)})`);
console.log("dont, dans la plage >= 200 :", ai.filter((i) => i >= 300).join(","), "<- ce sont les tranches metier x ville, pas des fiches tech");
console.log("capacite fiches non tech :", NB_SITEMAPS_PROS * 45000, "| tech :", NB_SITEMAPS_PROS_AI * 45000, "| metier x ville :", NB_SITEMAPS_CAT_CITY * 45000);
