/**
 * Contenu UNIQUE par métier pour les pages /trouver-des-chantiers/[metier],
 * récupéré via Perplexity API (recherche web + citations, modèle sonar).
 *
 * Angle PRO (à ne pas confondre avec lib/data/metier-content.ts, qui parle au
 * PARTICULIER sur /[metier] : réutiliser le même texte ici créerait de la
 * duplication interne, le défaut qui a coûté l'indexation en août).
 * Ici on parle à l'artisan : état de la demande dans SON métier, chantiers les
 * plus demandés, saisonnalité, conseils pour décrocher des chantiers.
 *
 * Sortie : lib/data/chantiers-pro-content.ts (statique, ISR-safe, zéro requête
 * au rendu). La page l'affiche conditionnellement : tant qu'un métier n'est pas
 * généré, elle rend sans ce bloc, rien ne casse.
 *
 * ~1 requête par métier BTP (~25) avec le modèle sonar. Respecte « zéro chiffre
 * inventé » : tout chiffre vient du web cité, et les marqueurs [N] sont retirés.
 *
 * Usage : npx tsx scripts/fetch-chantiers-pro-content.ts [--dry-run] [--force]
 *         (sans --force : complète uniquement les métiers manquants)
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const KEY = process.env.PERPLEXITY_API_KEY;
const DRY = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");
if (!KEY) {
  console.error("PERPLEXITY_API_KEY manquante dans .env.local");
  process.exit(1);
}

const OUT = path.resolve(process.cwd(), "lib/data/chantiers-pro-content.ts");

export type ChantiersProEntry = {
  /** 2-3 phrases : etat de la demande pour ce metier, cote artisan. */
  marche: string;
  /** 3-5 types de chantiers les plus demandes par les particuliers. */
  chantiersDemandes: string[];
  /** 1-2 phrases sur la saisonnalite de la demande. */
  saisonnalite: string;
  /** 3 conseils concrets pour decrocher plus de chantiers dans ce metier. */
  conseils: string[];
  sources: string[];
  retrievedAt: string;
};

function buildPrompt(nom: string): string {
  const year = new Date().getFullYear();
  return (
    `Tu ecris pour un ARTISAN ${nom} en France en ${year} qui cherche des chantiers. ` +
    `En te basant sur des sources web recentes et fiables (federations du batiment, presse pro, etudes de marche) :\n` +
    `1. "marche" : 2 a 3 phrases sur l'etat de la DEMANDE des particuliers pour ce metier (volume, tension, tendance). Chiffres uniquement si sources.\n` +
    `2. "chantiersDemandes" : les 4 types de chantiers que les particuliers demandent le plus a ce metier.\n` +
    `3. "saisonnalite" : 1 a 2 phrases sur les periodes de forte et faible demande.\n` +
    `4. "conseils" : 3 conseils concrets et actionnables pour qu'un ${nom} decroche plus de chantiers (reactivite, avis, photos, devis...).\n\n` +
    `REGLES : texte en francais, tutoiement interdit (vouvoyer), AUCUN chiffre invente, ` +
    `pas de nom de plateforme concurrente, phrases courtes et concretes.\n` +
    `INTERDIT ABSOLU : le tiret cadratin et le tiret demi-cadratin, remplace-les par une virgule ou un deux-points.\n\n` +
    `Reponds UNIQUEMENT avec un objet JSON valide (aucun texte avant ou apres) au format EXACT :\n` +
    `{"marche":"...","chantiersDemandes":["..."],"saisonnalite":"...","conseils":["..."]}`
  );
}

// Retire les marqueurs [N] de citation et les tirets interdits (pattern des
// scripts Perplexity du projet, cf. fetch-sourced-prices.ts).
function nettoie(s: string): string {
  return s
    .replace(/\[\d+\]/g, "")
    .replace(/—/g, ", ")
    .replace(/–/g, "-")
    .replace(/\s+,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function fetchMetier(nom: string): Promise<{ entry: ChantiersProEntry | null }> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar",
      temperature: 0.2,
      messages: [{ role: "user", content: buildPrompt(nom) }],
    }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  const content: string = data?.choices?.[0]?.message?.content || "";
  const cites: string[] = data?.citations || data?.search_results?.map((r: { url: string }) => r.url) || [];
  const m = content.match(/\{[\s\S]*\}/);
  if (!m) return { entry: null };
  try {
    const p = JSON.parse(m[0]);
    if (!p.marche || !Array.isArray(p.chantiersDemandes) || !Array.isArray(p.conseils)) return { entry: null };
    return {
      entry: {
        marche: nettoie(String(p.marche)),
        chantiersDemandes: p.chantiersDemandes.slice(0, 5).map((x: unknown) => nettoie(String(x))),
        saisonnalite: nettoie(String(p.saisonnalite || "")),
        conseils: p.conseils.slice(0, 4).map((x: unknown) => nettoie(String(x))),
        sources: cites.slice(0, 5),
        retrievedAt: new Date().toISOString().slice(0, 10),
      },
    };
  } catch {
    return { entry: null };
  }
}

async function main() {
  // Métiers cibles : les catégories BTP réelles de la base (la page LP ne
  // résout que vertical="btp"). Lues via Supabase pour ne pas maintenir une
  // liste en dur qui divergerait (leçon du 26/05 sur les mappings figés).
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: cats, error } = await sb
    .from("categories")
    .select("slug, name")
    .eq("vertical", "btp")
    .order("slug");
  if (error || !cats?.length) {
    console.error("Lecture des categories en echec :", error?.message);
    process.exit(1);
  }

  // Reprise : on relit l'existant comme du JSON pur (même contrat que
  // metier-content.ts : AUCUN commentaire à l'intérieur du littéral).
  let existing: Record<string, ChantiersProEntry> = {};
  if (!FORCE && fs.existsSync(OUT)) {
    const src = fs.readFileSync(OUT, "utf8");
    const m = src.match(/CHANTIERS_PRO_CONTENT[^=]*=\s*(\{[\s\S]*\});/);
    if (m) {
      try { existing = JSON.parse(m[1]); } catch { existing = {}; }
    }
  }

  const todo = cats.filter((c) => !existing[c.slug]);
  console.log(`${cats.length} metiers BTP, ${Object.keys(existing).length} deja faits, ${todo.length} a generer`);
  if (DRY) { todo.forEach((c) => console.log("  -", c.slug)); return; }

  for (const c of todo) {
    process.stdout.write(`  ${c.slug} ... `);
    const { entry } = await fetchMetier(c.name.toLowerCase());
    if (entry) { existing[c.slug] = entry; console.log("ok"); }
    else console.log("ECHEC (saute, relancer le script pour completer)");
    await new Promise((r) => setTimeout(r, 1200));
  }

  const header =
    `// Contenu pro par métier pour /trouver-des-chantiers/[metier].\n` +
    `// Généré par scripts/fetch-chantiers-pro-content.ts (Perplexity sonar, sourcé).\n` +
    `// 🔴 CE FICHIER EST RELU COMME DU JSON PUR par son générateur : n'écris\n` +
    `// AUCUN commentaire à l'intérieur du littéral (leçon metier-content du 01/09).\n` +
    `// Régénérer : npx tsx scripts/fetch-chantiers-pro-content.ts [--force]\n\n` +
    `export type ChantiersProEntry = {\n  marche: string;\n  chantiersDemandes: string[];\n  saisonnalite: string;\n  conseils: string[];\n  sources: string[];\n  retrievedAt: string;\n};\n\n`;
  fs.writeFileSync(OUT, header + `export const CHANTIERS_PRO_CONTENT: Record<string, ChantiersProEntry> = ${JSON.stringify(existing, null, 2)};\n`);
  console.log(`ecrit : ${OUT} (${Object.keys(existing).length} metiers)`);
}

main();
