import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const KEY = process.env.PERPLEXITY_API_KEY!;

const prompt = `Tu es expert de la réforme française de la facturation électronique (e-invoicing). Réponds en français, factuel, avec les références et sources.

Contexte : une petite plateforme web (auto-entreprise) veut développer un outil pour aider les artisans du BTP à faire leurs DEVIS et éventuellement leurs FACTURES. Le fondateur s'inquiète : "les plateformes doivent être agréées pour la facturation électronique".

Questions précises :
A) La réforme de la facturation électronique (obligation 2026/2027) s'applique-t-elle aux DEVIS, ou UNIQUEMENT aux FACTURES B2B domestiques ? Un outil qui ne fait QUE des devis (et pas de transmission de factures) est-il concerné par l'obligation / l'agrément ?
B) Pour créer/émettre des FACTURES, faut-il OBLIGATOIREMENT être une PDP (Plateforme de Dématérialisation Partenaire) immatriculée ? Quelle est la différence entre une PDP, un OD (opérateur de dématérialisation), et un simple logiciel de facturation ? Peut-on faire de la facturation en s'appuyant sur une PDP partenaire plutôt qu'en devenant soi-même PDP ?
C) Quel est le CALENDRIER actuel (après les reports) pour les TPE / micro-entreprises : à partir de quand doivent-elles RECEVOIR, et à partir de quand ÉMETTRE des factures électroniques ?
D) Conclusion concrète : un petit éditeur peut-il légalement lancer (1) un outil de devis, (2) un outil de facturation, sans être agréé PDP ? Comment ?

Réponds structuré A à D, avec les dates et les sources.`;

async function main() {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "sonar", temperature: 0.1, messages: [{ role: "user", content: prompt }] }),
  });
  const data: any = await res.json();
  if (!res.ok || !data?.choices) { console.log(`API error ${res.status}: ${JSON.stringify(data).slice(0,300)}`); return; }
  console.log(data.choices[0]?.message?.content || "(vide)");
  const cites: string[] = (Array.isArray(data.citations) ? data.citations : null) ||
    (Array.isArray(data.search_results) ? data.search_results.map((s: any) => s.url).filter(Boolean) : []) || [];
  if (cites.length) { console.log("\n──── SOURCES ────"); cites.forEach((c, i) => console.log(`[${i+1}] ${c}`)); }
}
main();
