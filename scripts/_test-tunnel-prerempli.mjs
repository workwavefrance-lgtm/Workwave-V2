import puppeteer from "puppeteer-core";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--no-sandbox"] });

for (const url of [
  "http://localhost:3210/deposer-projet?categorie=macon",
  "http://localhost:3210/deposer-projet?categorie=macon&ville=poitiers",
  "http://localhost:3210/deposer-projet?besoin=fuite%20d%27eau",
  "http://localhost:3210/deposer-projet",
]) {
  const p = await b.newPage();
  await p.setViewport({ width: 375, height: 812, isMobile: true });
  const err = [];
  p.on("pageerror", (e) => err.push(e.message));
  await p.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await pause(900);
  const r = await p.evaluate(() => ({
    etape: (document.body.innerText.match(/Étape (\d) sur (\d)/) || []).slice(1).join("/"),
    cat: document.querySelector('input[name="categoryId"]')?.value || "-",
    ville: document.querySelector('input[name="cityId"]')?.value || "-",
    rappelBesoin: document.body.innerText.includes("Votre demande"),
  }));
  console.log(url.replace("http://localhost:3210", ""), "→", JSON.stringify(r), err.length ? "ERREURS: " + err : "");
  await p.close();
}
await b.close();
