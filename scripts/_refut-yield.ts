import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({
    siteUrl: "https://workwave.fr/",
    requestBody: { startDate: "2026-08-05", endDate: "2026-09-03", dimensions: ["page"], rowLimit: 25000 },
  });
  const rows = r.data.rows || [];
  // pages metier x ville : 2 segments, 2e segment SANS suffixe -NN (dept)
  const mv = rows.filter((x) => {
    const seg = (x.keys![0] || "").replace("https://workwave.fr/", "").split("/");
    if (seg.length !== 2 || !seg[1]) return false;
    if (["artisan","blog","guide-des-prix","ai","trouver-des-chantiers","trouver-des-clients"].includes(seg[0])) return false;
    return !/-\d{2,3}$/.test(seg[1]);
  });
  const clics = mv.reduce((s, x) => s + (x.clicks || 0), 0);
  const imps = mv.reduce((s, x) => s + (x.impressions || 0), 0);
  console.log("Pages metier x ville presentes en GSC (30j) :", mv.length);
  console.log("  clics cumules :", clics, "  impressions :", imps);
  console.log("  clic / page / jour :", (clics / 30 / mv.length).toFixed(5));
  const zero = mv.filter((x) => (x.clicks || 0) === 0).length;
  console.log("  dont 0 clic sur 30 jours :", zero, `(${(100*zero/mv.length).toFixed(0)}%)`);
  const med = mv.map(x=>x.clicks||0).sort((a,b)=>a-b)[Math.floor(mv.length/2)];
  console.log("  clics medians par page sur 30j :", med);
})();
