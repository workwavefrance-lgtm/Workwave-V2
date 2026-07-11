import { parseDepartmentSlug, generateDepartmentSlug } from "../lib/utils/slugs";
import type { Department } from "../lib/types/database";

const cases: [string, boolean, string?][] = [
  // Français : comportement STRICTEMENT inchangé
  ["vienne-86", true, "86"],
  ["correze-19", true, "19"],
  ["corse-du-sud-2a", true, "2a"],
  ["guadeloupe-971", true, "971"],
  ["saint-savin-86", true, "86"],   // matche mais rejeté ensuite par strict re-match (comportement existant)
  ["poitiers", false],
  ["saint-malo", false],            // ne doit PAS matcher un pattern alpha générique
  ["marseille", false],
  // Belges : nouveaux
  ["hainaut-wht", true, "wht"],
  ["liege-wlg", true, "wlg"],
  ["namur-wna", true, "wna"],
  ["brabant-wallon-wbr", true, "wbr"],
  ["luxembourg-belge-wlx", true, "wlx"],
  ["bruxelles-capitale-bru", true, "bru"],
  // Pièges belges
  ["mons-be", false],               // slug de VILLE belge suffixée, pas une province
  ["xxx-abc", false],               // alpha 3 lettres hors whitelist
  ["tournai", false],
];

let fail = 0;
for (const [slug, shouldMatch, code] of cases) {
  const r = parseDepartmentSlug(slug);
  const ok = shouldMatch ? r !== null && r.code === code : r === null;
  if (!ok) { fail++; console.log(`✗ ${slug} → ${JSON.stringify(r)} (attendu ${shouldMatch ? code : "null"})`); }
  else console.log(`✓ ${slug} → ${r ? r.code : "null"}`);
}

// generateDepartmentSlug sur les provinces belges (codes MAJUSCULES comme en BDD)
const provs: [Partial<Department>, string][] = [
  [{ name: "Hainaut", code: "WHT" }, "hainaut-wht"],
  [{ name: "Liège", code: "WLG" }, "liege-wlg"],
  [{ name: "Bruxelles-Capitale", code: "BRU" }, "bruxelles-capitale-bru"],
  [{ name: "Luxembourg belge", code: "WLX" }, "luxembourg-belge-wlx"],
  [{ name: "Brabant wallon", code: "WBR" }, "brabant-wallon-wbr"],
  [{ name: "Namur", code: "WNA" }, "namur-wna"],
  [{ name: "Vienne", code: "86" }, "vienne-86"],
  [{ name: "Corse-du-Sud", code: "2A" }, "corse-du-sud-2a"],
];
for (const [d, expected] of provs) {
  const s = generateDepartmentSlug(d as Department);
  const roundtrip = parseDepartmentSlug(s);
  const ok = s === expected && roundtrip !== null && roundtrip.code === d.code!.toLowerCase();
  if (!ok) { fail++; console.log(`✗ generate ${d.name} → ${s} (attendu ${expected}), roundtrip ${JSON.stringify(roundtrip)}`); }
  else console.log(`✓ generate ${d.name} → ${s} (roundtrip OK)`);
}
console.log(fail === 0 ? "\n✅ TOUS LES TESTS PASSENT" : `\n🔴 ${fail} ÉCHECS`);
process.exit(fail === 0 ? 0 : 1);
