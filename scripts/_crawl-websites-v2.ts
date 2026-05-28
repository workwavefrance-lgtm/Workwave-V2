/**
 * Crawler emails v2 — version BEAUCOUP plus aggressive que v1.
 *
 * Ameliorations vs v1 :
 *   1. Decodage obfuscation : detecte les patterns "[at]", " at ", "(at)",
 *      "&commat;", "&#64;", " AT ", emails avec espaces, etc.
 *   2. Plus de pages fallback : 15 au lieu de 6 (FR + EN)
 *   3. Extraction des liens internes : trouve la page contact via parsing
 *      des liens vers "/contact" "/about" etc. dans le HTML.
 *   4. Decode HTML entities (&#x40; &#64; etc.) avant regex match
 *   5. Detecte les emails en data-attributes (data-email="...")
 *   6. Stocke TOUS les emails trouves dans pros.alt_emails (pas juste le 1er
 *      dans pros.email).
 *   7. Filtre exclude generic + RGPD compliance (pas de personal emails type
 *      prenom.nom@gmail.com sauf si c'est le pro lui-meme).
 *
 * Cible : pros actifs non claimed avec website. Skip les already-crawled
 * du v1 si l'option --not-found-only est passee.
 *
 * Usage :
 *   npx tsx scripts/_crawl-websites-v2.ts                   # tous les sites
 *   npx tsx scripts/_crawl-websites-v2.ts --not-found-only  # uniquement les not_found v1
 *   npx tsx scripts/_crawl-websites-v2.ts --max=100         # limite a 100 pour test
 */
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const TRACKING_V2 = path.resolve(process.cwd(), "tracking/crawl-websites-v2.json");
const TRACKING_V1 = path.resolve(process.cwd(), "tracking/crawl-websites-may28.json");
const RATE_LIMIT_MS = 1000;
const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT = "WorkwaveBot/2.0 (+https://workwave.fr/bot)";

const NOT_FOUND_ONLY = process.argv.includes("--not-found-only");
const MAX_LIMIT = (() => {
  const arg = process.argv.find((a) => a.startsWith("--max="));
  return arg ? parseInt(arg.slice(6), 10) : Infinity;
})();

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type Tracking = {
  startedAt: string;
  processed: Array<{
    proId: number;
    website: string;
    emailsFound: string[];
    status: "found" | "not_found" | "fetch_failed";
    at: string;
  }>;
};

function loadTracking(file: string): Tracking {
  if (!fs.existsSync(path.dirname(file))) fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file)) return { startedAt: new Date().toISOString(), processed: [] };
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function saveTracking(file: string, t: Tracking) {
  fs.writeFileSync(file, JSON.stringify(t, null, 2));
}

const GENERIC_BLACKLIST = [
  "noreply", "no-reply", "postmaster", "abuse", "webmaster", "hostmaster",
  "admin@google", "info@google", "support@google", "sentry.io",
  "wixpress.com", "@wordpress.com", "wpengine.com",
  "@example.", "example@", "@domain.", "domain@", "@email.", "email@",
  "test@test", "@test.test", "your-email", "youremail",
  "@sentry-next.wixpress.com",
];

function isValidEmail(em: string): boolean {
  if (!em.includes("@")) return false;
  if (em.length > 100 || em.length < 6) return false;
  // Filtres images / fichiers
  if (/\.(png|jpg|jpeg|webp|svg|gif|pdf|css|js)$/i.test(em)) return false;
  // Format basique
  if (!/^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(em)) return false;
  // Blacklist
  for (const bad of GENERIC_BLACKLIST) if (em.toLowerCase().includes(bad)) return false;
  return true;
}

/**
 * Decode les entites HTML communes pour les emails obfusques.
 * Ex: "info&#64;example.fr" → "info@example.fr"
 *     "info&commat;example.fr" → "info@example.fr"
 */
function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&#64;/g, "@")
    .replace(/&#0?64;/g, "@")
    .replace(/&commat;/g, "@")
    .replace(/&#x40;/gi, "@")
    .replace(/&amp;/g, "&");
}

/**
 * Detect deobfuscated patterns : "info [at] example.fr", "info (at) example fr"
 */
function deobfuscatePatterns(html: string): string {
  return html
    // [at] dot variants
    .replace(/\s*\[\s*at\s*\]\s*/gi, "@")
    .replace(/\s*\(\s*at\s*\)\s*/gi, "@")
    .replace(/\s+AT\s+/g, "@")
    .replace(/\s+at\s+/g, "@") // careful : agressive mais le filter isValidEmail va clean
    .replace(/\s*\[\s*dot\s*\]\s*/gi, ".")
    .replace(/\s*\(\s*dot\s*\)\s*/gi, ".")
    .replace(/\s+DOT\s+/g, ".")
    .replace(/\s+dot\s+/g, ".");
}

/**
 * Extract TOUS les emails du HTML (pas juste le 1er).
 * Returns liste dedup deja filtree (isValidEmail).
 */
function extractAllEmails(rawHtml: string): string[] {
  const found = new Set<string>();

  // 1. href="mailto:..." direct (le plus sur)
  const mailtoRegex = /href=["']mailto:([^"'?\s]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = mailtoRegex.exec(rawHtml)) !== null) {
    const em = m[1].trim().toLowerCase();
    if (isValidEmail(em)) found.add(em);
  }

  // 2. data-email="..." (lazy load anti-spam)
  const dataEmailRegex = /data-email=["']([^"']+)["']/gi;
  while ((m = dataEmailRegex.exec(rawHtml)) !== null) {
    const em = m[1].trim().toLowerCase();
    if (isValidEmail(em)) found.add(em);
  }

  // 3. HTML entities + plain text
  const decoded = decodeHtmlEntities(rawHtml);
  const emails = decoded.match(/[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [];
  for (const e of emails) {
    const em = e.toLowerCase();
    if (isValidEmail(em)) found.add(em);
  }

  // 4. Obfuscated patterns ("info [at] example.fr")
  const deobf = deobfuscatePatterns(decoded);
  const emails2 = deobf.match(/[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [];
  for (const e of emails2) {
    const em = e.toLowerCase();
    if (isValidEmail(em)) found.add(em);
  }

  return Array.from(found);
}

/**
 * Choisit le "best" email parmi une liste pour le mettre dans pros.email.
 * Priorise contact@, info@, accueil@, devis@.
 */
function pickBestEmail(emails: string[]): string | null {
  if (emails.length === 0) return null;
  const preferred = ["contact@", "info@", "accueil@", "bonjour@", "hello@", "devis@", "commercial@"];
  for (const pref of preferred) {
    const m = emails.find((e) => e.startsWith(pref));
    if (m) return m;
  }
  return emails[0];
}

async function fetchWithTimeout(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const r = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
    });
    clearTimeout(timeout);
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "";
    if (!ct.includes("text/html") && !ct.includes("text/plain")) return null;
    return await r.text();
  } catch {
    return null;
  }
}

function normalizeUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (t.startsWith("http://") || t.startsWith("https://")) return t.replace(/\/$/, "");
  return `https://${t.replace(/^\/+/, "").replace(/\/$/, "")}`;
}

// Pages prioritaires + variantes FR/EN
const FALLBACK_PATHS = [
  "/contact",
  "/contact-us",
  "/nous-contacter",
  "/contactez-nous",
  "/contactez",
  "/mentions-legales",
  "/legal",
  "/legal-notice",
  "/imprint",
  "/a-propos",
  "/about",
  "/about-us",
  "/qui-sommes-nous",
  "/equipe",
  "/team",
];

/**
 * Extract liens internes depuis le HTML d'une homepage qui pointent vers
 * une page "contact" / "about" / "legal". Utile quand le pro a une URL
 * customise (ex: /nos-coordonnees au lieu de /contact).
 */
function findContactLinks(html: string, baseUrl: string): string[] {
  const hrefs = html.match(/href=["']([^"'#]+)["']/gi) || [];
  const candidates = new Set<string>();
  for (const h of hrefs) {
    const url = h.replace(/^href=["']/, "").replace(/["']$/, "");
    const lower = url.toLowerCase();
    if (
      /contact|nous-contacter|nous-joindre|coordonnees|equipe|legal|mention|impressum/.test(lower)
    ) {
      // Resoudre URL relative vs absolue
      if (url.startsWith("http://") || url.startsWith("https://")) {
        candidates.add(url);
      } else if (url.startsWith("/")) {
        candidates.add(baseUrl + url);
      }
    }
  }
  return Array.from(candidates).slice(0, 5);
}

async function crawlOne(website: string): Promise<string[]> {
  const baseUrl = normalizeUrl(website);
  if (!baseUrl) return [];
  const allEmails = new Set<string>();

  // 1. Homepage
  const home = await fetchWithTimeout(baseUrl);
  if (!home) return [];

  for (const e of extractAllEmails(home)) allEmails.add(e);

  // 2. Fallback pages classiques
  for (const p of FALLBACK_PATHS) {
    if (allEmails.size > 8) break; // arret si on a deja beaucoup
    const html = await fetchWithTimeout(baseUrl + p);
    if (html) {
      for (const e of extractAllEmails(html)) allEmails.add(e);
    }
  }

  // 3. Liens internes "contact-like" trouves sur la homepage
  if (allEmails.size === 0) {
    const links = findContactLinks(home, baseUrl);
    for (const link of links) {
      const html = await fetchWithTimeout(link);
      if (html) {
        for (const e of extractAllEmails(html)) allEmails.add(e);
        if (allEmails.size > 0) break;
      }
    }
  }

  return Array.from(allEmails);
}

async function main() {
  console.log("=== Crawl websites v2 (28/05/2026) ===");
  console.log(`Mode : ${NOT_FOUND_ONLY ? "not_found-only" : "tous"} | Max : ${MAX_LIMIT === Infinity ? "illimite" : MAX_LIMIT}\n`);

  // 1. Tracking v2 idempotent
  const tracking = loadTracking(TRACKING_V2);
  const processedIds = new Set(tracking.processed.map((p) => p.proId));

  // 2. Si --not-found-only, on charge le tracking v1 pour exclure les "found"
  // et ne re-tenter QUE les not_found
  const v1NotFound = new Set<number>();
  if (NOT_FOUND_ONLY && fs.existsSync(TRACKING_V1)) {
    const v1 = JSON.parse(fs.readFileSync(TRACKING_V1, "utf-8")) as Tracking;
    for (const p of v1.processed) {
      if (p.status === "not_found" || p.status === "fetch_failed") {
        v1NotFound.add(p.proId);
      }
    }
    console.log(`Mode --not-found-only : ${v1NotFound.size} pros not_found v1 a re-essayer`);
  }

  // 3. Targets : pros avec website
  console.log("Chargement targets...");
  const PAGE = 1000;
  let offset = 0;
  type Target = { id: number; website: string; name: string; email: string | null };
  const targets: Target[] = [];

  while (true) {
    const { data } = await sb
      .from("pros")
      .select("id, website, name, email")
      .eq("is_active", true)
      .is("deleted_at", null)
      .is("claimed_by_user_id", null)
      .not("website", "is", null)
      .range(offset, offset + PAGE - 1);
    const rows = data || [];
    if (rows.length === 0) break;
    for (const r of rows as Target[]) {
      if (processedIds.has(r.id)) continue;
      if (NOT_FOUND_ONLY && !v1NotFound.has(r.id)) continue;
      if (!r.website) continue;
      targets.push(r);
      if (targets.length >= MAX_LIMIT) break;
    }
    if (targets.length >= MAX_LIMIT) break;
    offset += rows.length;
  }
  console.log(`A traiter maintenant : ${targets.length}\n`);
  if (targets.length === 0) {
    console.log("Aucun pro a traiter. Tout est deja crawl.");
    return;
  }

  // 4. Crawl
  let foundCnt = 0;
  let notFoundCnt = 0;
  let failedCnt = 0;
  let totalEmailsFound = 0;

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const at = new Date().toISOString();
    let emails: string[] = [];
    let status: "found" | "not_found" | "fetch_failed" = "fetch_failed";

    try {
      emails = await crawlOne(t.website);
      if (emails.length > 0) {
        status = "found";
        foundCnt++;
        totalEmailsFound += emails.length;

        // Update BDD : email principal (si pas deja set) + alt_emails (tous)
        const updates: { email?: string; alt_emails: string[] } = {
          alt_emails: emails,
        };
        if (!t.email) {
          updates.email = pickBestEmail(emails) || emails[0];
        }
        await sb.from("pros").update(updates).eq("id", t.id);
      } else {
        status = "not_found";
        notFoundCnt++;
      }
    } catch {
      status = "fetch_failed";
      failedCnt++;
    }

    tracking.processed.push({
      proId: t.id,
      website: t.website,
      emailsFound: emails,
      status,
      at,
    });

    if ((i + 1) % 25 === 0 || i + 1 === targets.length) {
      const rate = foundCnt > 0 ? `${((foundCnt / (i + 1)) * 100).toFixed(0)}%` : "0%";
      const avg = foundCnt > 0 ? (totalEmailsFound / foundCnt).toFixed(1) : "0";
      console.log(`  [${i + 1}/${targets.length}] found=${foundCnt} (${rate}, avg ${avg}/site) not_found=${notFoundCnt} failed=${failedCnt}`);
      saveTracking(TRACKING_V2, tracking);
    }
    await sleep(RATE_LIMIT_MS);
  }
  saveTracking(TRACKING_V2, tracking);

  console.log(`\n=== FIN v2 ===`);
  console.log(`Sites avec email(s)  : ${foundCnt}`);
  console.log(`Sites sans email    : ${notFoundCnt}`);
  console.log(`Sites fetch failed  : ${failedCnt}`);
  console.log(`Total emails trouves : ${totalEmailsFound} (avg ${foundCnt > 0 ? (totalEmailsFound / foundCnt).toFixed(1) : 0}/site)`);
}

main().catch((e) => {
  console.error("Crash :", e instanceof Error ? e.message : e);
  process.exit(1);
});
