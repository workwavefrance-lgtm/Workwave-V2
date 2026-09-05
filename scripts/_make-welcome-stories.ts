import { config } from "dotenv";
import path from "path";
import fs from "fs";
import os from "os";
import { spawn } from "child_process";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT_DIR = path.join(os.homedir(), "Desktop", "Workwave-stories");
const FONT_DIR = "/tmp/wwfonts";
const ALL = process.argv.includes("--all");
const LATEST = process.argv.includes("--latest");

function sleepSync(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function fontFace(weight: number): string {
  const b64 = fs.readFileSync(path.join(FONT_DIR, `poppins-${weight}.woff2`)).toString("base64");
  return `@font-face{font-family:'Poppins';font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
}
const FONTS = [400, 600, 700, 800].map(fontFace).join("");

type Theme = {
  key: string; bg: string; wordmark: string; hello: string;
  name: string; divider: string; rejoint: string; thanks: string;
};
const THEMES: Theme[] = [
  { key: "A-sombre", bg: "#0A0A0A", wordmark: "#FAFAFA", hello: "#FAFAFA", name: "#FF5A36", divider: "#FF5A36", rejoint: "#FAFAFA", thanks: "#9CA3AF" },
  { key: "B-coral",  bg: "#FF5A36", wordmark: "#FFFFFF", hello: "rgba(255,255,255,0.92)", name: "#FFFFFF", divider: "#FFFFFF", rejoint: "#FFFFFF", thanks: "rgba(255,255,255,0.85)" },
  { key: "C-clair",  bg: "#FFFFFF", wordmark: "#0A0A0A", hello: "#0A0A0A", name: "#FF5A36", divider: "#FF5A36", rejoint: "#0A0A0A", thanks: "#6B7280" },
];

function nameSize(name: string): number {
  const n = name.length;
  if (n <= 9) return 150;
  if (n <= 14) return 118;
  if (n <= 20) return 92;
  if (n <= 28) return 74;
  return 60;
}

function buildHtml(name: string, t: Theme): string {
  const fs2 = nameSize(name);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:1080px;height:1920px;}
.wrap{width:1080px;height:1920px;background:${t.bg};font-family:'Poppins',sans-serif;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:0 110px;position:relative;}
.wordmark{position:absolute;top:150px;left:0;right:0;font-size:36px;font-weight:600;
  letter-spacing:14px;color:${t.wordmark};}
.hello{font-size:104px;font-weight:700;letter-spacing:3px;color:${t.hello};margin-bottom:34px;}
.name{font-size:${fs2}px;font-weight:800;line-height:1.04;color:${t.name};
  margin-bottom:48px;max-width:880px;word-wrap:break-word;}
.divider{width:96px;height:9px;border-radius:5px;background:${t.divider};margin:0 auto 58px;}
.rejoint{font-size:48px;font-weight:600;color:${t.rejoint};margin-bottom:30px;}
.thanks{font-size:34px;font-weight:400;color:${t.thanks};line-height:1.45;}
.foot{position:absolute;bottom:130px;left:0;right:0;font-size:30px;font-weight:600;
  letter-spacing:4px;color:${t.thanks};}
</style></head><body>
<div class="wrap">
  <div class="wordmark">WORKWAVE</div>
  <div class="hello">BIENVENUE</div>
  <div class="name">${name}</div>
  <div class="divider"></div>
  <div class="rejoint">a rejoint Workwave 🚀</div>
  <div class="thanks">Merci pour votre confiance.</div>
  <div class="foot">workwave.fr</div>
</div>
</body></html>`;
}

function cleanName(raw: string): string {
  const before = raw.split(" (")[0].trim();
  return before || raw.trim();
}

function slug(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

// Chrome 149 ne se termine pas après --screenshot : on le lance détaché,
// on attend que le PNG soit stable, puis on tue le groupe de process.
function render(htmlPath: string, outPath: string): boolean {
  try { fs.rmSync(outPath, { force: true }); } catch { /* noop */ }
  const udd = `/tmp/ww-chrome-${path.basename(outPath, ".png")}`;
  const child = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox",
    "--force-device-scale-factor=1", "--window-size=1080,1920",
    `--user-data-dir=${udd}`, `--screenshot=${outPath}`, `file://${htmlPath}`,
  ], { detached: true, stdio: "ignore" });
  const pid = child.pid;
  let ok = false, lastSize = -1, stable = 0;
  const start = Date.now();
  while (Date.now() - start < 15000) {
    sleepSync(350);
    if (fs.existsSync(outPath)) {
      const sz = fs.statSync(outPath).size;
      if (sz > 0 && sz === lastSize) { stable++; if (stable >= 2) { ok = true; break; } }
      else stable = 0;
      lastSize = sz;
    }
  }
  try { if (pid) process.kill(-pid, "SIGKILL"); } catch { /* noop */ }
  try { child.kill("SIGKILL"); } catch { /* noop */ }
  try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* noop */ }
  return ok;
}

async function main() {
  const { data, error } = await sb.from("pros")
    .select("id, name, claimed_at, source")
    .not("claimed_by_user_id", "is", null)
    .neq("source", "ai_signup")
    .eq("is_active", true).is("deleted_at", null)
    .order("claimed_at", { ascending: false });
  if (error) { console.error(error.message); return; }
  const pros = (data || []).filter((p) => p.name);
  const list = LATEST ? pros.slice(0, 1) : ALL ? pros : pros.slice(0, 3);
  console.log(`${pros.length} pros réclamés (BTP). Génération de ${list.length} (3 styles en alternance).\n`);

  let i = 0, done = 0;
  for (const p of list) {
    const theme = LATEST ? THEMES[0] : THEMES[i % 3];
    const name = cleanName(p.name);
    const htmlPath = `/tmp/ww-story-${p.id}.html`;
    fs.writeFileSync(htmlPath, buildHtml(name, theme));
    const outName = LATEST
      ? `${slug(name)}_${theme.key}.png`
      : `${String(i + 1).padStart(2, "0")}_${slug(name)}_${theme.key}.png`;
    const outPath = path.join(OUT_DIR, outName);
    const t0 = Date.now();
    const ok = render(htmlPath, outPath);
    console.log(`${ok ? "✓" : "✗"} ${outName}  (${name})  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    if (ok) done++;
    i++;
  }
  console.log(`\n${done}/${list.length} générés dans : ${OUT_DIR}`);
}
main();
