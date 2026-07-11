/**
 * Génère les guides réglementaires belges (blog_posts) — contenu SOURCÉ Perplexity
 * (l'info réglementaire DOIT être exacte + citée). Fort SEO/AEO : requêtes à
 * haute intention que les concurrents couvrent mal ou avec de l'info périmée.
 *
 * Guides : TVA 6% rénovation, Primes Wallonie, Attestation RGIE, Primes Bruxelles.
 * Sortie : table blog_posts (status='published') → /blog/[slug], dans le sitemap.
 *
 * Usage : npx tsx scripts/generate-guides-belgique.ts [--dry-run]
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const KEY = process.env.PERPLEXITY_API_KEY!;
const DRY = process.argv.includes("--dry-run");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const YEAR = new Date().getFullYear();

type Guide = { slug: string; title: string; meta: string; topic: string };

const GUIDES: Guide[] = [
  {
    slug: "tva-6-renovation-belgique",
    title: `TVA 6 % sur la rénovation en Belgique : conditions ${YEAR}`,
    meta: `TVA réduite à 6 % pour la rénovation d'un logement de plus de 10 ans en Belgique : conditions, travaux concernés, démarches. Guide ${YEAR}.`,
    topic: `le taux de TVA réduit à 6 % pour la rénovation d'un logement privé en Belgique (au lieu de 21 %) en ${YEAR} : condition d'ancienneté du logement (plus de 10 ans), travaux immobiliers concernés et exclus, qui applique le taux (l'entrepreneur), l'attestation/mention requise sur la facture, la différence avec le neuf (21 %), et les évolutions récentes des règles (démolition-reconstruction 6 %). `,
  },
  {
    slug: "primes-renovation-wallonie",
    title: `Primes rénovation en Wallonie ${YEAR} : le guide complet`,
    meta: `Primes rénovation et énergie en Wallonie ${YEAR} : Prime Habitation, montants selon revenus, audit logement obligatoire, travaux éligibles, comment demander.`,
    topic: `les primes à la rénovation et à l'énergie en Wallonie en ${YEAR} (Prime Habitation / primes Habitation) : le principe de l'audit logement préalable obligatoire, les catégories de revenus (R1 à R6 et coefficients multiplicateurs), les types de travaux éligibles (toiture, isolation, châssis, chauffage, audit), l'ordre des travaux, comment introduire une demande, et les changements récents du régime wallon. `,
  },
  {
    slug: "attestation-rgie-controle-electrique-belgique",
    title: `Contrôle électrique RGIE en Belgique : obligations ${YEAR}`,
    meta: `Attestation de conformité électrique (RGIE) en Belgique : quand le contrôle est obligatoire, qui le réalise, validité 25 ans, prix, que faire en cas de non-conformité.`,
    topic: `le contrôle de l'installation électrique et l'attestation de conformité RGIE (Règlement Général sur les Installations Électriques) en Belgique en ${YEAR} : quand la visite de contrôle est obligatoire (nouvelle installation, vente d'un bien, modification importante), qui réalise le contrôle (organisme agréé), la durée de validité (25 ans pour une installation conforme), le prix indicatif, ce qui se passe en cas de non-conformité (délai de mise en conformité et re-contrôle), et le rôle de l'électricien. `,
  },
  {
    slug: "primes-renovation-bruxelles-renolution",
    title: `Primes RENOLUTION à Bruxelles ${YEAR} : rénovation et énergie`,
    meta: `Primes RENOLUTION à Bruxelles ${YEAR} : prime unique rénovation + énergie, montants selon revenus, travaux éligibles, conditions et démarches. Guide à jour.`,
    topic: `les primes RENOLUTION en Région de Bruxelles-Capitale en ${YEAR} (prime unique fusionnant rénovation et énergie) : les catégories de revenus, les travaux éligibles (isolation, toiture, châssis, chauffage, audit), le principe de la demande (avant ou après travaux selon les cas), les montants, et l'état actuel du dispositif (évolutions/suspensions récentes éventuelles). Sois précis sur ce qui est à jour en ${YEAR}. `,
  },
];

function buildPrompt(g: Guide): string {
  return (
    `Rédige un guide informatif FACTUEL et À JOUR (${YEAR}) sur : ${g.topic}\n\n` +
    `PUBLIC : des particuliers belges (Wallonie/Bruxelles) qui font des travaux. Ton clair, pédagogique, honnête.\n` +
    `RÈGLES IMPÉRATIVES :\n` +
    `- Uniquement des informations EXACTES issues de sources officielles/fiables récentes (belgium.be, wallonie.be, renolution.brussels, SPF Finances, SPF Économie). Si une règle a changé ou est suspendue en ${YEAR}, dis-le.\n` +
    `- N'invente AUCUN chiffre : montants, taux, seuils uniquement s'ils sont sourcés. Si tu n'es pas sûr d'un montant exact, reste qualitatif.\n` +
    `- Format MARKDOWN : commence directement par un paragraphe d'introduction (PAS de titre H1), puis 4 à 6 sections '## Titre', puis une section '## Questions fréquentes' avec 3-4 questions en '### Question ?'. ~800-1100 mots.\n` +
    `- Termine par une phrase invitant à trouver un professionnel qualifié sur Workwave (workwave.fr) pour réaliser ces travaux.\n` +
    `- N'utilise PAS de marqueurs de citation type [1], [2] dans le texte.\n` +
    `Réponds directement avec le markdown, rien d'autre.`
  );
}

async function fetchGuide(g: Guide): Promise<{ content: string; sources: string[] } | null> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "sonar", temperature: 0.2, messages: [{ role: "user", content: buildPrompt(g) }] }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  if (!res.ok || !data?.choices) {
    console.log(`  ✗ ${g.slug}: API ${res.status} ${JSON.stringify(data).slice(0, 120)}`);
    return null;
  }
  let content: string = data.choices[0]?.message?.content || "";
  content = content.replace(/\[\d+\]/g, "").trim(); // retirer les marqueurs [N]
  const sources: string[] =
    (Array.isArray(data.search_results) ? data.search_results.map((s: { url?: string }) => s.url).filter(Boolean) : []) ||
    (Array.isArray(data.citations) ? data.citations : []) ||
    [];
  if (content.length < 400) { console.log(`  ✗ ${g.slug}: contenu trop court`); return null; }
  return { content, sources: sources.slice(0, 5) };
}

async function main() {
  console.log(`Guides réglementaires belges — ${GUIDES.length} guides${DRY ? " (DRY, 1)" : ""}\n`);
  const list = DRY ? GUIDES.slice(0, 1) : GUIDES;
  for (const g of list) {
    const r = await fetchGuide(g);
    if (!r) continue;
    // Ajoute une note de source + disclaimer en pied
    const footer =
      `\n\n---\n\n*Ce guide est fourni à titre informatif et peut évoluer : vérifiez toujours les conditions officielles en vigueur avant vos travaux. ` +
      (r.sources.length ? `Sources : ${r.sources.join(", ")}.*` : `*`);
    const content = r.content + footer;
    console.log(`  ✓ ${g.slug.padEnd(48)} ${content.length} car · ${r.sources.length} sources`);
    if (DRY) { console.log("\n─── APERÇU ───\n" + content.slice(0, 800) + "\n…\n"); continue; }

    const row = {
      slug: g.slug,
      title: g.title,
      meta_description: g.meta,
      content,
      category_slug: null,
      city_slug: null,
      tags: ["belgique", "reglementation", "renovation"],
      author: "Workwave",
      status: "published",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await sb.from("blog_posts").upsert(row, { onConflict: "slug" });
    if (error) console.log(`    KO insert: ${error.message}`);
    else console.log(`    → https://workwave.fr/blog/${g.slug}`);
    await new Promise((r) => setTimeout(r, 1500));
  }
  console.log("\nOK");
}

main().catch((e) => { console.error(e); process.exit(1); });
