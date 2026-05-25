/**
 * Enrichit les freelances tech (vertical='tech') avec leur username GitHub.
 *
 * Strategie de matching :
 *   1. Filtre les pros tech sans github_username, avec un nom au format
 *      "PRENOM NOM" propre (heuristique : 2 tokens, pas de parens, pas
 *      de SARL/EURL/etc., et ratio caps reasonable)
 *   2. Search GitHub Users API : "FirstName LastName location:France"
 *   3. Match strict :
 *      - 1 resultat unique → accept
 *      - Plusieurs resultats, mais 1 seul avec location FR + name match
 *        → accept celui-la
 *      - Sinon → skip (trop ambigu)
 *   4. Stocke github_username + last_synced_at dans pros
 *
 * Rate limit GitHub :
 *   - Search Users API : 30 req/min avec token (PAT)
 *   - Sans token : 10 req/min seulement (impraticable)
 *   - On respecte 2.2s entre requetes pour rester safe (27 req/min)
 *
 * Setup token :
 *   1. Aller sur https://github.com/settings/tokens (fine-grained)
 *   2. Generate new token (classic ou fine-grained suffit)
 *   3. Scopes : public_repo + read:user (rien de plus)
 *   4. Ajouter dans .env.local : GITHUB_TOKEN=ghp_xxx
 *
 * Run :
 *   npx tsx scripts/enrich-github-tech.ts                   # dry-run, 20 premiers
 *   npx tsx scripts/enrich-github-tech.ts --limit=100       # dry-run 100
 *   npx tsx scripts/enrich-github-tech.ts --limit=100 --apply
 *   npx tsx scripts/enrich-github-tech.ts --apply           # tous les tech sans github (LONG)
 *
 * Volume estime : ~70-100k pros tech × 20-30% match rate = ~15-30k matches
 * Duree estimee France entiere : ~60h (rate limit search). Conseille en
 * background ou par morceaux (--limit=5000 chaque jour).
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
  override: true,
});

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── CLI args ──────────────────────────────────────────────────────────────
const APPLY = process.argv.includes("--apply");
const LIMIT_ARG = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split("=")[1], 10) : 20;

// ─── Config ────────────────────────────────────────────────────────────────
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error("❌ GITHUB_TOKEN manquant dans .env.local");
  console.error("   Cree un token : https://github.com/settings/tokens");
  console.error("   Scopes : public_repo + read:user suffisent");
  process.exit(1);
}

const RATE_LIMIT_MS = 2200; // 27 req/min, marge sous la limite 30/min
const SEARCH_API = "https://api.github.com/search/users";

const TECH_CATEGORY_IDS = [43, 44, 45, 46, 47, 48];

// ─── Types ─────────────────────────────────────────────────────────────────
type GitHubUser = {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: "User" | "Organization";
};

type GitHubSearchResponse = {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubUser[];
};

type GitHubUserDetails = {
  login: string;
  name: string | null;
  location: string | null;
  bio: string | null;
  followers: number;
  public_repos: number;
  hireable: boolean | null;
  blog: string | null;
};

type ProRow = {
  id: number;
  name: string;
  postal_code: string | null;
  city_id: number | null;
};

// ─── Helpers ───────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseName(name: string): { firstName: string; lastName: string } | null {
  // Heuristique pour extraire prenom + nom
  // Reject si :
  //   - contient SARL/EURL/SAS/EI/etc.
  //   - contient nombres
  //   - moins de 2 tokens
  //   - plus de 4 tokens (probablement nom commercial)
  //   - contient parens (probablement nom commercial entre parens)

  const cleaned = name
    .replace(/\(.*?\)/g, "") // remove parens content
    .replace(/\b(SARL|EURL|SAS|SASU|EI|SCI|SCM|SCS|SNC|GIE|EARL|SCEA)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (/[0-9]/.test(cleaned)) return null;
  const tokens = cleaned.split(" ").filter((t) => t.length > 1);
  if (tokens.length < 2 || tokens.length > 4) return null;

  // Convention française : NOM en CAPS, Prenom en Title Case
  // Si on a "DUPONT Jean" → first=Jean, last=DUPONT
  // Si on a "Jean DUPONT" → first=Jean, last=DUPONT
  // Si tout en CAPS, le premier est probablement le NOM
  const allCaps = tokens.every((t) => t === t.toUpperCase());

  let firstName: string;
  let lastName: string;

  if (allCaps && tokens.length === 2) {
    // Ambigu, default : 1er = prenom (convention internationale)
    firstName = tokens[0];
    lastName = tokens[1];
  } else if (tokens.length === 2) {
    // Mixed case : si token[0] est all caps = nom, sinon prenom
    if (tokens[0] === tokens[0].toUpperCase() && tokens[1] !== tokens[1].toUpperCase()) {
      lastName = tokens[0];
      firstName = tokens[1];
    } else {
      firstName = tokens[0];
      lastName = tokens[1];
    }
  } else {
    // 3-4 tokens : prendre 1er et dernier
    firstName = tokens[0];
    lastName = tokens[tokens.length - 1];
  }

  // Normalize : title case
  const titleCase = (s: string) =>
    s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return {
    firstName: titleCase(firstName),
    lastName: titleCase(lastName),
  };
}

async function searchGitHub(
  firstName: string,
  lastName: string
): Promise<GitHubUser[]> {
  // Query : fullname + location FR
  const q = `${firstName} ${lastName} location:France`;
  const url = `${SEARCH_API}?q=${encodeURIComponent(q)}&per_page=5`;
  try {
    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (r.status === 403 || r.status === 429) {
      // Rate limit, wait longer
      const reset = r.headers.get("x-ratelimit-reset");
      const waitS = reset ? Math.max(1, parseInt(reset, 10) - Math.floor(Date.now() / 1000)) : 60;
      console.warn(`    ⏳ Rate limit, wait ${waitS}s...`);
      await sleep(waitS * 1000 + 1000);
      return searchGitHub(firstName, lastName);
    }
    if (!r.ok) return [];
    const data = (await r.json()) as GitHubSearchResponse;
    return (data.items || []).filter((u) => u.type === "User");
  } catch (e) {
    console.warn(`    fetch error:`, e);
    return [];
  }
}

async function getUserDetails(login: string): Promise<GitHubUserDetails | null> {
  try {
    const r = await fetch(`https://api.github.com/users/${login}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!r.ok) return null;
    return (await r.json()) as GitHubUserDetails;
  } catch {
    return null;
  }
}

function looksLikeName(githubName: string | null, firstName: string, lastName: string): boolean {
  if (!githubName) return false;
  const g = githubName.toLowerCase();
  const f = firstName.toLowerCase();
  const l = lastName.toLowerCase();
  return g.includes(f) && g.includes(l);
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Workwave AI — Enrich GitHub username pour pros tech");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`Mode  : ${APPLY ? "✓ APPLY" : "○ DRY-RUN"}`);
  console.log(`Limit : ${LIMIT}\n`);

  // Charge tech pros sans github_username
  const { data: pros, error } = await supabase
    .from("pros")
    .select("id, name, postal_code, city_id")
    .in("category_id", TECH_CATEGORY_IDS)
    .eq("source", "sirene")
    .is("github_username", null)
    .eq("is_active", true)
    .is("deleted_at", null)
    .limit(LIMIT);

  if (error) {
    console.error("❌ Query error:", error);
    process.exit(1);
  }

  console.log(`[init] ${pros?.length || 0} pros tech sans GitHub a tester\n`);

  let matched = 0;
  let skipped = 0;
  let ambiguous = 0;
  const start = Date.now();

  for (const pro of pros || []) {
    const parsed = parseName(pro.name);
    if (!parsed) {
      skipped++;
      console.log(`[${pro.id}] ${pro.name.slice(0, 40)} → skip (nom non parsable)`);
      continue;
    }

    const candidates = await searchGitHub(parsed.firstName, parsed.lastName);
    await sleep(RATE_LIMIT_MS);

    if (candidates.length === 0) {
      console.log(`[${pro.id}] ${parsed.firstName} ${parsed.lastName} → 0 match`);
      continue;
    }

    // Si plusieurs, on cherche celui qui matche le nom au mieux
    let bestMatch: GitHubUser | null = null;
    if (candidates.length === 1) {
      // Single result, verify via details
      const details = await getUserDetails(candidates[0].login);
      await sleep(RATE_LIMIT_MS);
      if (details && looksLikeName(details.name, parsed.firstName, parsed.lastName)) {
        bestMatch = candidates[0];
      }
    } else {
      // Multiple : check each, prefer those with name match + FR location
      for (const cand of candidates.slice(0, 3)) {
        const details = await getUserDetails(cand.login);
        await sleep(RATE_LIMIT_MS);
        if (!details) continue;
        if (
          looksLikeName(details.name, parsed.firstName, parsed.lastName) &&
          (details.location?.toLowerCase().includes("france") ||
            details.location?.toLowerCase().includes("paris") ||
            details.location?.toLowerCase().includes("lyon") ||
            details.location?.toLowerCase().includes("bordeaux"))
        ) {
          bestMatch = cand;
          break;
        }
      }
      if (!bestMatch) ambiguous++;
    }

    if (bestMatch) {
      matched++;
      console.log(
        `[${pro.id}] ${parsed.firstName} ${parsed.lastName} → @${bestMatch.login} ✓`
      );

      if (APPLY) {
        await supabase
          .from("pros")
          .update({ github_username: bestMatch.login })
          .eq("id", pro.id);
      }
    } else {
      console.log(
        `[${pro.id}] ${parsed.firstName} ${parsed.lastName} → ambigu (${candidates.length} candidats)`
      );
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Pros testes    : ${pros?.length || 0}`);
  console.log(`Skip parse     : ${skipped}`);
  console.log(`Matched        : ${matched}`);
  console.log(`Ambigu         : ${ambiguous}`);
  console.log(`Duree          : ${elapsed}s`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((e) => {
  console.error("❌ Fatal:", e);
  process.exit(1);
});
