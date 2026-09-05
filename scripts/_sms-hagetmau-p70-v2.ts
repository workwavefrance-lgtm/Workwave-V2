/**
 * RENVOI format chaleureux validé · projet #70 (vitres Hagetmau), 18 cibles max
 * choisies par pertinence : spécialistes vitres d'abord, puis proximité.
 */
import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const BREVO_API_KEY = process.env.BREVO_API_KEY!;
const APPLY = process.argv.includes("--execute");
const TRACK = path.resolve(process.cwd(), "tracking/sms-hagetmau-p70-v2.json");

// 18 cibles : 6 spécialistes vitres + 5 Saint-Sever (15 km) + 4 Mont-de-Marsan + 3 proches
const TARGETS: { name: string; phone: string }[] = [
  { name: "NETT' VITRES RAMONAGE (Amou)", phone: "0646928981" },
  { name: "NETAVA - Nettoyage vitres (Bassercles)", phone: "0617808986" },
  { name: "Pro Vitres net service (Tarnos)", phone: "0661565816" },
  { name: "MCM Net Vitre (Tartas)", phone: "0638829054" },
  { name: "laveur de vitres de l'Adour (Josse)", phone: "0632183819" },
  { name: "Crystal clean services 64", phone: "0647268279" },
  { name: "DEBARRAS'NET40 (Saint-Sever)", phone: "0614495395" },
  { name: "Aspir Adour (Saint-Sever)", phone: "0612528995" },
  { name: "D-F-G (Saint-Sever)", phone: "0683589058" },
  { name: "Les Compagnons Gascons (Saint-Sever)", phone: "0645373751" },
  { name: "RMS Rudy arnoult (Saint-Sever)", phone: "0785847785" },
  { name: "Nettia (Mont-de-Marsan)", phone: "0642900940" },
  { name: "PASSE PARTOUT (Mont-de-Marsan)", phone: "0632084260" },
  { name: "D'Ouro MULTISERVICES (Mont-de-Marsan)", phone: "0762733558" },
  { name: "La Maniaquerie (Mont-de-Marsan)", phone: "0783697952" },
  { name: "XTREM CLEAN (Saint-Pandelon)", phone: "0784709903" },
  { name: "OPC HOUSE TECHNIQUE (Meilhan)", phone: "0603943571" },
  { name: "L.B Cleaning (Orthez)", phone: "0759765405" },
];

const content = "Bonjour, c'est Workwave. Un particulier recherche un pro du nettoyage de vitres a Hagetmau (ce mois-ci). Le projet : nettoyage des vitres de sa maison. Pour voir la demande en entier et le contacter, activez gratuitement votre fiche sur workwave.fr/pro. STOP au 36180";

async function main() {
  let sent: string[] = [];
  try { sent = JSON.parse(fs.readFileSync(TRACK, "utf8")); } catch { /* premier run */ }
  console.log(`Mode ${APPLY ? "EXECUTE" : "DRY"} · ${TARGETS.length} cibles · SMS ${content.length} car (2 segments)`);
  console.log(`« ${content} »\n`);
  let ok = 0;
  for (const t of TARGETS) {
    const e164 = "+33" + t.phone.slice(1);
    if (sent.includes(e164)) { console.log(`  ⏭️ ${t.name}`); continue; }
    if (!APPLY) { console.log(`  → ${t.name}`); continue; }
    const r = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
      method: "POST",
      headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ sender: "Workwave", recipient: e164, content }),
    });
    if (r.ok) { sent.push(e164); ok++; console.log(`  ✓ ${t.name}`); }
    else console.error(`  ✗ ${t.name} : ${r.status}`);
    await new Promise((res) => setTimeout(res, 500));
  }
  if (APPLY) { fs.mkdirSync(path.dirname(TRACK), { recursive: true }); fs.writeFileSync(TRACK, JSON.stringify(sent)); console.log(`\n✓ ${ok} SMS envoyés (format validé).`); }
}
main().catch((e) => { console.error(e); process.exit(1); });
