import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { qualifyProject } from "../lib/ai/qualify-project";

// Descriptions de VRAIS clients (styles varies : detaille, laconique, fautes,
// tout en majuscules, tres court) -> aucune ne doit depasser 70 (= suspicious).
const CAS = [
  { label: "detaille",  desc: "Bonjour, je souhaite faire poser du carrelage dans ma salle de bain de 6 m2, au sol et sur les murs de la douche. L'ancien carrelage est deja retire. Merci de me faire un devis." },
  { label: "laconique", desc: "carrelage salle de bain" },
  { label: "fautes",    desc: "bonjour je voudré refaire le carlage de ma salle de bin ossi les mur merci de me rapelé" },
  { label: "majuscules",desc: "POSE CARRELAGE SALLE DE BAIN 6M2 SOL ET MURS DEVIS RAPIDE SVP" },
  { label: "vide",      desc: "" },
];

(async () => {
  console.log("Seuil : un score > 70 met le projet en 'suspicious' (NON route aux artisans).\n");
  let faux = 0;
  for (const c of CAS) {
    const q = await qualifyProject({
      categoryName: "Carreleur", categorySlug: "carreleur",
      cityName: "Marseille", description: c.desc,
      urgency: "this_month", budget: "2000_5000", countryName: "France",
    });
    if (!q) { console.log(`[${c.label}] ECHEC qualification`); faux++; continue; }
    const flag = q.suspicion_score > 70 ? "❌ FLAGGE SUSPECT" : "✅ passe";
    if (q.suspicion_score > 70) faux++;
    console.log(`[${c.label.padEnd(11)}] score ${String(q.suspicion_score).padStart(3)} ${flag}  | cat: ${q.suggested_category} (match ${q.category_match})`);
  }
  console.log("");
  if (faux > 0) console.log(`⚠️ ${faux} cas legitime(s) seraient bloques -> faux positifs a corriger`);
  else console.log("✅ AUCUN faux positif : les vraies demandes passent bien.");
})();
