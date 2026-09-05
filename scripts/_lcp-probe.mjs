/**
 * Mesure LCP mobile RÉEL via Chrome (CDP), throttling proche Lighthouse mobile
 * (CPU 4x, réseau ~Slow 4G). Rapporte LCP + élément, FCP, TTFB, DOM, et ce qui
 * pèse dans le HTML (JSON-LD inline, scripts, CSS).
 * Usage : node scripts/_lcp-probe.mjs <url> [url2 ...]
 */
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const urls = process.argv.slice(2);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });

for (const url of urls) {
  const page = await browser.newPage();
  // Observer LCP AVANT navigation (buffered).
  await page.evaluateOnNewDocument(() => {
    window.__lcp = null;
    try {
      new PerformanceObserver((l) => {
        const es = l.getEntries();
        const e = es[es.length - 1];
        window.__lcp = {
          t: Math.round(e.startTime),
          tag: e.element ? e.element.tagName : null,
          cls: e.element ? (e.element.className || "").toString().slice(0, 50) : "",
          text: e.element ? (e.element.textContent || "").trim().slice(0, 70) : "",
          isImg: e.element ? e.element.tagName === "IMG" : false,
          src: e.element ? (e.element.currentSrc || e.element.src || "") : "",
        };
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch (e) {}
  });
  const client = await page.target().createCDPSession();
  await client.send("Network.enable");
  await client.send("Network.emulateNetworkConditions", {
    offline: false, latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
  });
  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.emulate({
    viewport: { width: 412, height: 823, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true },
    userAgent: "Mozilla/5.0 (Linux; Android 11; moto g power) Chrome/124 Mobile Safari/537.36",
  });
  try {
    await page.goto(url, { waitUntil: "load", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2000));
    const m = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0] || {};
      const fcp = (performance.getEntriesByType("paint").find((p) => p.name === "first-contentful-paint") || {}).startTime;
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')];
      const ldBytes = ld.reduce((a, s) => a + (s.textContent || "").length, 0);
      const scripts = [...document.querySelectorAll("script[src]")];
      const css = [...document.querySelectorAll('link[rel="stylesheet"]')];
      const inlineScripts = [...document.querySelectorAll("script:not([src])")];
      const inlineBytes = inlineScripts.reduce((a, s) => a + (s.textContent || "").length, 0);
      return {
        ttfb: Math.round(nav.responseStart || 0),
        fcp: Math.round(fcp || 0),
        lcp: window.__lcp,
        domNodes: document.getElementsByTagName("*").length,
        ldCount: ld.length, ldKB: Math.round(ldBytes / 1024),
        scriptSrc: scripts.length, css: css.length,
        inlineKB: Math.round(inlineBytes / 1024),
        htmlKB: Math.round(document.documentElement.outerHTML.length / 1024),
      };
    });
    console.log("\n==== " + url + " ====");
    console.log("  TTFB " + m.ttfb + "ms | FCP " + m.fcp + "ms | LCP " + (m.lcp ? m.lcp.t + "ms" : "?"));
    if (m.lcp) console.log("  LCP element: " + (m.lcp.isImg ? "IMG " + m.lcp.src : m.lcp.tag + "." + m.lcp.cls + " «" + m.lcp.text + "»"));
    console.log("  DOM " + m.domNodes + " noeuds | HTML rendu " + m.htmlKB + "KB");
    console.log("  JSON-LD: " + m.ldCount + " blocs, " + m.ldKB + "KB | inline JS " + m.inlineKB + "KB | <script src> " + m.scriptSrc + " | CSS " + m.css);
  } catch (e) {
    console.log("\n==== " + url + " ==== ERREUR: " + e.message);
  }
  await page.close();
}
await browser.close();
