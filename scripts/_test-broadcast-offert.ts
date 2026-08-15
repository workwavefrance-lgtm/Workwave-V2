/** Rendu des 3 versions du mail de diffusion selon le compteur. Aucun envoi. */
import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { buildEmailHtml } from "@/lib/email/broadcast-btp-project";

const input = {
  projectId: 186, projectTitle: "Maçon à Versailles",
  categoryName: "Maçon", categoryId: 5, cityName: "Versailles",
  cityId: 1, projectCityId: 1, departmentId: 78,
  projectDescription: "Enduit lisse et peinture dans une cuisine d'environ 25 m².",
  budget: "lt500", urgency: "this_month", isSuspicious: false,
} as never;

for (const r of [2, 1, 0]) {
  const html = buildEmailHtml(input, "https://workwave.fr", "78000", r);
  const aEncadre = html.includes("FFF4E8") && /offert/i.test(html);
  const bouton = /Voir le projet \(offert\)/.test(html) ? "Voir le projet (offert)" : "Voir le projet";
  const phrase = html.match(/(Il vous reste 1 d&eacute;blocage offert|Vos \d+ premiers d&eacute;blocages sont offerts)/)?.[0] || "(aucune)";
  console.log(`  ${r} offert(s) restant(s) :`);
  console.log(`     encadré gratuité : ${aEncadre ? "OUI" : "non"}`);
  console.log(`     phrase           : ${phrase}`);
  console.log(`     bouton           : ${bouton}`);
  console.log(`     bas de mail parle des 2 offerts : ${/vos 2 premiers deblocages sont offerts/i.test(html) ? "OUI" : "NON"}`);
  fs.writeFileSync(`/tmp/broadcast-${r}-offerts.html`, html);
}
console.log("\n  3 rendus ecrits dans /tmp/broadcast-*.html");
