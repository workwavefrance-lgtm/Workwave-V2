/**
 * Audit : detecte les fiches dont le domaine email NE CORRESPOND PAS au nom de l'entreprise
 * (= cas potentiel d'enrichissement Apify foire, comme miroiterie-melusine vs labalademelusine).
 *
 * Methodologie :
 *   1. Pour chaque pro avec email + name :
 *      - Extraire le domaine de l'email (apres @)
 *      - Tokeniser le nom commercial (mots > 3 chars)
 *      - Si AUCUN token n'est dans le domaine ET le domaine n'est pas un freemail (gmail, yahoo, etc.) -> SUSPECT
 *   2. Pareil pour le website : si le domaine du website ne contient AUCUN token du nom -> SUSPECT
 *
 * Run : npx tsx scripts/_audit-apify-mismatch.ts
 *       npx tsx scripts/_audit-apify-mismatch.ts --csv  (export CSV)
 */
import path from "path";
import fs from "fs";
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

const FREEMAIL_DOMAINS = new Set([
  "gmail.com", "yahoo.fr", "yahoo.com", "hotmail.fr", "hotmail.com",
  "outlook.fr", "outlook.com", "live.fr", "live.com", "free.fr",
  "orange.fr", "wanadoo.fr", "sfr.fr", "laposte.net", "neuf.fr",
  "icloud.com", "me.com", "aol.com", "msn.com", "bbox.fr",
  "numericable.fr", "club-internet.fr", "noos.fr", "alice.fr",
  "voila.fr", "mail.com", "yopmail.com", "protonmail.com",
  "proton.me", "tutanota.com", "gmx.fr", "gmx.com", "9online.fr",
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((t) => t.length >= 4) // mots de 4+ chars
    .filter((t) => !["sarl", "saru", "sasu", "eurl", "eirl", "scop", "sci", "sas", "sa", "ets", "etablissements", "entreprise", "societe", "groupe", "centre", "atelier", "service", "services"].includes(t));
}

function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  return at >= 0 ? email.slice(at + 1).toLowerCase() : "";
}

function websiteDomain(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isMismatch(name: string, domain: string): boolean {
  if (!domain) return false;
  if (FREEMAIL_DOMAINS.has(domain)) return false; // ignore freemails
  const tokens = tokenize(name);
  if (tokens.length === 0) return false;
  // Le domaine (sans .fr/.com) doit contenir AU MOINS UN token du nom
  const domainStripped = domain.replace(/\.[a-z]{2,4}$/, "").replace(/[^a-z0-9]/g, "");
  for (const t of tokens) {
    if (domainStripped.includes(t) || t.includes(domainStripped.slice(0, 5))) return false;
  }
  return true;
}

async function main() {
  const exportCsv = process.argv.includes("--csv");
  console.log("=== Audit mismatch email/website vs nom (Apify enrichissement) ===\n");

  // Pull tous les pros avec email OU website + name
  const all: Array<{
    id: number;
    slug: string;
    name: string;
    email: string | null;
    website: string | null;
  }> = [];
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data } = await supabase
      .from("pros")
      .select("id, slug, name, email, website")
      .or("email.not.is.null,website.not.is.null")
      .not("name", "is", null)
      .order("id", { ascending: true })
      .range(offset, offset + PAGE - 1);
    const rows = (data || []) as typeof all;
    if (rows.length === 0) break;
    all.push(...rows);
    if (rows.length < PAGE) break;
    offset += rows.length;
  }
  console.log(`Total pros avec email OU website + name : ${all.length}\n`);

  const suspects: Array<{
    id: number;
    slug: string;
    name: string;
    email: string | null;
    website: string | null;
    emailMismatch: boolean;
    websiteMismatch: boolean;
  }> = [];

  for (const p of all) {
    const eDom = p.email ? emailDomain(p.email) : "";
    const wDom = p.website ? websiteDomain(p.website) : "";
    const eMis = p.email ? isMismatch(p.name, eDom) : false;
    const wMis = p.website ? isMismatch(p.name, wDom) : false;
    if (eMis || wMis) {
      suspects.push({ ...p, emailMismatch: eMis, websiteMismatch: wMis });
    }
  }

  console.log(`Suspects detectes : ${suspects.length}\n`);
  console.log("Top 15 :");
  for (const s of suspects.slice(0, 15)) {
    const flags = [];
    if (s.emailMismatch) flags.push(`email:${s.email}`);
    if (s.websiteMismatch) flags.push(`web:${s.website}`);
    console.log(`  ${s.slug.padEnd(45)} ${s.name.padEnd(35)} ${flags.join(", ")}`);
  }

  if (exportCsv) {
    const csvPath = path.resolve(process.cwd(), "scripts/.audit-apify-mismatch.csv");
    const lines = [
      "id,slug,name,email,website,email_mismatch,website_mismatch",
      ...suspects.map((s) => [
        s.id,
        `"${s.slug}"`,
        `"${s.name.replace(/"/g, "''")}"`,
        `"${s.email ?? ""}"`,
        `"${s.website ?? ""}"`,
        s.emailMismatch,
        s.websiteMismatch,
      ].join(",")),
    ];
    fs.writeFileSync(csvPath, lines.join("\n"));
    console.log(`\nCSV exporte : ${csvPath}`);
  }

  // Stats par tier
  const onlyEmail = suspects.filter((s) => s.emailMismatch && !s.websiteMismatch).length;
  const onlyWeb = suspects.filter((s) => !s.emailMismatch && s.websiteMismatch).length;
  const both = suspects.filter((s) => s.emailMismatch && s.websiteMismatch).length;
  console.log(`\n=== Stats ===`);
  console.log(`  Email mismatch only    : ${onlyEmail}`);
  console.log(`  Website mismatch only  : ${onlyWeb}`);
  console.log(`  BOTH (haute proba)     : ${both}  <- les plus surs`);
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
