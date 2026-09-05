/**
 * Enrichit les pros sans email via scraping direct (PagesJaunes + sites web).
 * Aucune API externe requise.
 *
 * Usage :
 *   npx tsx scripts/scrape-pro-emails.ts                  # tous les pros sans email
 *   npx tsx scripts/scrape-pro-emails.ts --limit 10       # 10 premiers
 *   npx tsx scripts/scrape-pro-emails.ts --offset 100     # commence au 101e
 *   npx tsx scripts/scrape-pro-emails.ts --dry-run        # affiche sans mettre a jour la base
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const IGNORED_DOMAINS = new Set([
  "example.com", "example.fr", "test.com", "email.com", "domain.com",
  "sentry.io", "wixpress.com", "googleapis.com", "googleusercontent.com",
  "w3.org", "schema.org", "gravatar.com", "wordpress.org", "wordpress.com",
  "jquery.com", "cloudflare.com", "gstatic.com", "google.com",
  "facebook.com", "twitter.com", "instagram.com", "linkedin.com",
  "pagesjaunes.fr", "solocal.com",
]);

const IGNORED_PREFIXES = new Set([
  "noreply", "no-reply", "mailer-daemon", "postmaster", "webmaster",
  "abuse", "root", "admin", "support", "privacy", "legal",
]);

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isValidEmail(email: string): boolean {
  const lower = email.toLowerCase().trim();
  const [prefix, domain] = lower.split("@");
  if (!domain || !prefix) return false;
  if (IGNORED_DOMAINS.has(domain)) return false;
  if (IGNORED_PREFIXES.has(prefix)) return false;
  if (lower.includes("..")) return false;
  if (lower.length > 100 || lower.length < 5) return false;
  if (/\.(png|jpg|jpeg|gif|svg|css|js|xml|json|woff|ttf|ico)$/i.test(lower)) return false;
  // Doit avoir un TLD valide
  if (!/\.[a-z]{2,10}$/.test(domain)) return false;
  return true;
}

function extractEmails(text: string): string[] {
  const matches = text.match(EMAIL_REGEX) || [];
  return [...new Set(matches.filter(isValidEmail))];
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) return null;
    const html = await res.text();
    return html.slice(0, 500000);
  } catch {
    return null;
  }
}

function extractEmailsFromHtml(html: string): string[] {
  const $ = cheerio.load(html);

  // 1. mailto: links
  const mailtoEmails: string[] = [];
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr("href") || "";
    const email = href.replace("mailto:", "").split("?")[0].trim();
    if (email) mailtoEmails.push(email);
  });

  // 2. Texte visible
  const textEmails = extractEmails($("body").text());

  // 3. HTML brut (attributs, meta, etc.)
  const rawEmails = extractEmails(html);

  return [...new Set([...mailtoEmails, ...textEmails, ...rawEmails])];
}

// --- Strategie 1 : PagesJaunes ---

async function searchPagesJaunes(
  proName: string,
  cityName: string
): Promise<{ email: string | null; phone: string | null; website: string | null }> {
  // Recherche sur PagesJaunes
  const query = encodeURIComponent(proName);
  const city = encodeURIComponent(cityName);
  const url = `https://www.pagesjaunes.fr/pagesblanches/recherche?quoiqui=${query}&ou=${city}`;

  const html = await fetchPage(url);
  if (!html) {
    // Essayer aussi annuaire pro
    const url2 = `https://www.pagesjaunes.fr/recherche/${city}/${query}`;
    const html2 = await fetchPage(url2);
    if (!html2) return { email: null, phone: null, website: null };
    return parsePagesJaunesResults(html2);
  }

  return parsePagesJaunesResults(html);
}

function parsePagesJaunesResults(html: string): {
  email: string | null;
  phone: string | null;
  website: string | null;
} {
  const $ = cheerio.load(html);
  let email: string | null = null;
  let phone: string | null = null;
  let website: string | null = null;

  // Chercher les emails dans la page
  const emails = extractEmailsFromHtml(html).filter(
    (e) => !e.includes("pagesjaunes") && !e.includes("solocal")
  );
  if (emails.length > 0) email = emails[0];

  // Chercher les liens vers des sites web
  $('a[href]').each((_, el) => {
    const href = $(el).attr("href") || "";
    if (
      href.includes("http") &&
      !href.includes("pagesjaunes") &&
      !href.includes("solocal") &&
      !href.includes("google") &&
      !href.includes("facebook") &&
      !href.includes("twitter") &&
      !href.includes("instagram") &&
      !href.includes("linkedin") &&
      !href.includes("youtube")
    ) {
      if (!website) website = href;
    }
  });

  // Chercher les numeros de telephone
  const phoneRegex = /(?:0[1-9])(?:[\s.-]?\d{2}){4}/g;
  const phoneMatches = $("body").text().match(phoneRegex);
  if (phoneMatches && phoneMatches.length > 0) {
    phone = phoneMatches[0].replace(/[\s.-]/g, "");
  }

  return { email, phone, website };
}

// --- Strategie 2 : Scraping du site web du pro ---

async function scrapeProWebsite(
  websiteUrl: string,
  proName: string
): Promise<string | null> {
  const html = await fetchPage(websiteUrl);
  if (!html) return null;

  const emails = extractEmailsFromHtml(html);
  if (emails.length === 0) return null;

  // Prioriser les emails lies au nom du pro
  const proWords = proName
    .toLowerCase()
    .split(/[\s-]+/)
    .filter((w) => w.length > 3);

  const bestMatch = emails.find((e) => {
    const domain = e.split("@")[1]?.toLowerCase() || "";
    return proWords.some((word) => domain.includes(word));
  });

  return bestMatch || emails[0];
}

// --- Strategie 3 : Societe.com ---

async function searchSociete(siret: string): Promise<string | null> {
  if (!siret) return null;
  const siren = siret.slice(0, 9);
  const url = `https://www.societe.com/societe/${siren}.html`;

  const html = await fetchPage(url);
  if (!html) return null;

  const emails = extractEmailsFromHtml(html).filter(
    (e) => !e.includes("societe.com")
  );

  return emails.length > 0 ? emails[0] : null;
}

// --- Orchestration ---

async function findEmailForPro(pro: {
  id: number;
  name: string;
  siret: string | null;
  website: string | null;
  phone: string | null;
  city_name: string;
}): Promise<{
  email: string | null;
  website: string | null;
  phone: string | null;
  source: string;
}> {
  // Strategie 1 : Si le pro a un site web, le scraper directement
  if (pro.website) {
    const email = await scrapeProWebsite(pro.website, pro.name);
    if (email) {
      return { email, website: pro.website, phone: null, source: "website" };
    }
  }

  // Strategie 2 : Chercher sur PagesJaunes
  const pjResult = await searchPagesJaunes(pro.name, pro.city_name);
  if (pjResult.email) {
    return {
      email: pjResult.email,
      website: pjResult.website || pro.website,
      phone: pjResult.phone,
      source: "pagesjaunes",
    };
  }

  // Si PagesJaunes a trouve un site web mais pas d'email, scraper le site
  if (pjResult.website && pjResult.website !== pro.website) {
    const email = await scrapeProWebsite(pjResult.website, pro.name);
    if (email) {
      return {
        email,
        website: pjResult.website,
        phone: pjResult.phone,
        source: "pagesjaunes_website",
      };
    }
  }

  // Strategie 3 : Societe.com via SIRET
  if (pro.siret) {
    const email = await searchSociete(pro.siret);
    if (email) {
      return {
        email,
        website: pjResult.website || pro.website,
        phone: pjResult.phone,
        source: "societe.com",
      };
    }
  }

  return {
    email: null,
    website: pjResult.website || pro.website,
    phone: pjResult.phone || null,
    source: "not_found",
  };
}

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const offsetIdx = args.indexOf("--offset");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 0;
  const offset = offsetIdx >= 0 ? parseInt(args[offsetIdx + 1], 10) : 0;
  const dryRun = args.includes("--dry-run");

  console.log("=== Enrichissement emails pros (PagesJaunes + sites web) ===");
  if (dryRun) console.log("[DRY RUN] Aucune mise a jour en base.");
  if (limit) console.log(`Limite : ${limit} pros`);
  if (offset) console.log(`Offset : ${offset}`);

  // Charger les pros sans email
  let query = supabase
    .from("pros")
    .select("id, name, siret, website, phone, city_id")
    .is("email", null)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("id", { ascending: true });

  if (offset > 0) {
    query = query.range(offset, offset + (limit || 10000) - 1);
  } else if (limit > 0) {
    query = query.limit(limit);
  }

  const { data: pros, error: prosError } = await query;

  if (prosError) {
    console.error("Erreur chargement pros:", prosError.message);
    process.exit(1);
  }

  if (!pros || pros.length === 0) {
    console.log("Aucun pro sans email trouve.");
    process.exit(0);
  }

  // Charger les noms de ville
  const cityIds = [...new Set(pros.map((p) => p.city_id).filter(Boolean))];
  const { data: cities } = await supabase
    .from("cities")
    .select("id, name")
    .in("id", cityIds);

  const cityMap = new Map<number, string>(
    (cities || []).map((c: { id: number; name: string }) => [c.id, c.name])
  );

  console.log(`\n${pros.length} pros sans email a traiter.\n`);

  let found = 0;
  let notFound = 0;
  let errors = 0;
  let websitesUpdated = 0;
  let phonesUpdated = 0;

  for (let i = 0; i < pros.length; i++) {
    const pro = pros[i];
    const cityName = cityMap.get(pro.city_id) || "Vienne";
    const progress = `[${i + 1}/${pros.length}]`;

    try {
      const result = await findEmailForPro({
        ...pro,
        city_name: cityName,
      });

      if (result.email) {
        found++;
        console.log(
          `${progress} \u2713 ${pro.name} (${cityName}) \u2192 ${result.email} [${result.source}]`
        );

        if (!dryRun) {
          const updates: Record<string, unknown> = { email: result.email };
          if (result.website && !pro.website) {
            updates.website = result.website;
            websitesUpdated++;
          }
          if (result.phone && !pro.phone) {
            updates.phone = result.phone;
            phonesUpdated++;
          }
          await supabase.from("pros").update(updates).eq("id", pro.id);
        }
      } else {
        notFound++;
        console.log(
          `${progress} \u2717 ${pro.name} (${cityName}) \u2014 pas d'email [${result.source}]`
        );

        // Sauvegarder le site web / telephone meme sans email
        if (!dryRun) {
          const updates: Record<string, unknown> = {};
          if (result.website && !pro.website) {
            updates.website = result.website;
            websitesUpdated++;
          }
          if (result.phone && !pro.phone) {
            updates.phone = result.phone;
            phonesUpdated++;
          }
          if (Object.keys(updates).length > 0) {
            await supabase.from("pros").update(updates).eq("id", pro.id);
          }
        }
      }
    } catch (err) {
      errors++;
      const msg = err instanceof Error ? err.message : String(err);
      console.log(
        `${progress} \u26a0 ${pro.name} (${cityName}) \u2014 erreur: ${msg}`
      );
    }

    // Rate limiting : 2-4 secondes entre chaque pour eviter le blocage
    if (i < pros.length - 1) {
      await sleep(randomBetween(2000, 4000));
    }
  }

  console.log("\n=== Resume ===");
  console.log(`Pros traites      : ${pros.length}`);
  console.log(`Emails trouves    : ${found} (${((found / pros.length) * 100).toFixed(1)}%)`);
  console.log(`Pas d'email       : ${notFound}`);
  console.log(`Erreurs           : ${errors}`);
  console.log(`Sites web ajoutes : ${websitesUpdated}`);
  console.log(`Telephones ajoutes: ${phonesUpdated}`);
  if (dryRun) console.log("\n[DRY RUN] Aucune donnee modifiee en base.");
}

main().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
