/**
 * Audit automatique des noindex et Disallow dans le code.
 *
 * Vérifie qu'aucune page publique stratégique n'a accidentellement un noindex
 * ou n'est dans Disallow du robots.txt. Détecte les régressions SEO.
 *
 * Usage :
 *   npx tsx scripts/audit-noindex-robots.ts
 *   npx tsx scripts/audit-noindex-robots.ts --strict   # exit code 1 si probleme
 *
 * Inspiré de la leçon CLAUDE.md du 27/04/2026.
 */
import * as fs from "fs";
import * as path from "path";

const STRICT = process.argv.includes("--strict");

// =====================================================================
// Pages où le noindex EST AUTORISÉ (admin, transactionnel, RGPD, dev)
// Toute page hors de cette liste avec un noindex = problème SEO.
// =====================================================================
const NOINDEX_ALLOWED_PATTERNS = [
  /\/admin(\/|$)/,
  /\/pro\/dashboard(\/|$)/,
  /\/pro\/reclamer(\/|$)/,
  /\/pro\/connexion$/,
  /\/pro\/mot-de-passe-oublie/,
  /\/pro\/reinitialiser-mot-de-passe/,
  /\/auth(\/|$)/,
  /\/test(\/|$)/,
  /\/artisan\/.*\/supprimer/,
  /\/deposer-projet\/supprimer/,
  /\/unsubscribe(-all)?(\/|$)/,
];

// =====================================================================
// Patterns Disallow autorisés dans robots.ts (mêmes que ci-dessus)
// =====================================================================
const ROBOTS_DISALLOW_ALLOWED = [
  "/api/",
  "/admin/",
  "/pro/dashboard/",
  "/pro/connexion",
  "/pro/mot-de-passe-oublie",
  "/pro/reclamer/",
  "/auth/",
  "/test",
  "/artisan/*/supprimer",
];

type Issue = {
  level: "ERROR" | "WARN";
  file: string;
  line: number;
  message: string;
};

const issues: Issue[] = [];

function pathToRoute(filePath: string): string {
  // Convertit "app/(public)/artisan/[slug]/page.tsx" en "/artisan/[slug]"
  const rel = filePath.replace(/.*\/app\//, "/");
  return rel
    .replace(/\/page\.tsx$/, "")
    .replace(/\/route\.tsx?$/, "")
    .replace(/\/\(.*?\)/g, "") // strip route groups
    .replace(/\/$/, "")
    || "/";
}

function isNoindexAllowed(route: string): boolean {
  return NOINDEX_ALLOWED_PATTERNS.some((re) => re.test(route));
}

// Walk tous les page.tsx et layout.tsx
function walk(dir: string, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next") continue;
      walk(full, files);
    } else if (
      (e.name === "page.tsx" || e.name === "layout.tsx" || e.name === "route.ts")
      && full.includes("/app/")
    ) {
      files.push(full);
    }
  }
  return files;
}

// =====================================================================
// AUDIT 1 : noindex dans les pages
// =====================================================================
function auditNoindex() {
  const projectRoot = path.resolve(__dirname, "..");
  const files = walk(path.join(projectRoot, "app"));

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const lines = content.split("\n");
    const route = pathToRoute(file);

    lines.forEach((line, i) => {
      // Match "robots: { index: false ... }" ou "robots: \"noindex" ou similaires
      const hasNoindex =
        /index:\s*false/.test(line) ||
        /["']noindex/.test(line) ||
        /robots:\s*["'][^"']*noindex/.test(line);

      if (hasNoindex) {
        if (isNoindexAllowed(route)) {
          // OK, attendu
          return;
        }
        issues.push({
          level: "ERROR",
          file: file.replace(projectRoot + "/", ""),
          line: i + 1,
          message: `Noindex trouvé sur route publique "${route}" — INTERDIT par CLAUDE.md (leçon 27/04/2026). Si volontaire, retirer le noindex et utiliser un redirect 308 ou une priority sitemap réduite à la place.`,
        });
      }
    });
  }
}

// =====================================================================
// AUDIT 2 : robots.ts Disallow
// =====================================================================
function auditRobots() {
  const projectRoot = path.resolve(__dirname, "..");
  const robotsPath = path.join(projectRoot, "app/robots.ts");
  if (!fs.existsSync(robotsPath)) return;

  const content = fs.readFileSync(robotsPath, "utf-8");
  const lines = content.split("\n");

  // Extraire les Disallow
  const disallowRegex = /["'](\/[^"']*)["']/g;
  // On ne regarde que la zone "disallow:" (pas de flag s, on remplace . par [\s\S])
  const disallowSectionMatch = content.match(/disallow:\s*\[([\s\S]+?)\]/);
  if (!disallowSectionMatch) return;
  const disallowSection = disallowSectionMatch[1];

  const found: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = disallowRegex.exec(disallowSection)) !== null) {
    found.push(m[1]);
  }

  for (const pattern of found) {
    if (!ROBOTS_DISALLOW_ALLOWED.includes(pattern)) {
      // Trouver le numero de ligne
      const lineIdx = lines.findIndex((l) => l.includes(`"${pattern}"`));
      issues.push({
        level: "ERROR",
        file: "app/robots.ts",
        line: lineIdx + 1,
        message: `Disallow "${pattern}" dans robots.ts — non autorisé par CLAUDE.md (leçon 27/04/2026). Liste autorisée : ${ROBOTS_DISALLOW_ALLOWED.join(", ")}. Si nécessité réelle, demander validation Willy + count URLs impactées.`,
      });
    }
  }
}

// =====================================================================
// Main
// =====================================================================
function main() {
  console.log("============================================");
  console.log("Audit noindex + robots.txt (CLAUDE.md 27/04/2026)");
  console.log("============================================\n");

  auditNoindex();
  auditRobots();

  if (issues.length === 0) {
    console.log("✅ Aucun problème détecté.");
    console.log("   - Toutes les routes publiques stratégiques sont indexables");
    console.log("   - robots.txt Disallow respecte la liste autorisée");
    process.exit(0);
  }

  for (const issue of issues) {
    const prefix = issue.level === "ERROR" ? "❌ ERROR" : "⚠️  WARN ";
    console.log(`${prefix} ${issue.file}:${issue.line}`);
    console.log(`   ${issue.message}\n`);
  }

  console.log(`\nTotal : ${issues.length} problème(s)`);

  if (STRICT && issues.some((i) => i.level === "ERROR")) {
    process.exit(1);
  }
  process.exit(0);
}

main();
