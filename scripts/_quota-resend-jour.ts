/** Combien d'emails Resend sont partis AUJOURD'HUI (quota gratuit : 100/jour). */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
(async () => {
  const cle = process.env.RESEND_API_KEY!;
  const jour = new Date().toISOString().slice(0, 10);
  let apres: string | undefined, total = 0, aujourdhui = 0, fini = false;
  const sujets = new Map<string, number>();
  for (let page = 0; page < 6 && !fini; page++) {
    const url = new URL("https://api.resend.com/emails");
    url.searchParams.set("limit", "100");
    if (apres) url.searchParams.set("after", apres);
    const r = await fetch(url, { headers: { Authorization: `Bearer ${cle}` } });
    if (!r.ok) { console.error("ERREUR Resend:", r.status, (await r.text()).slice(0, 120)); process.exit(1); }
    const j = await r.json();
    const lot = j.data || [];
    if (!lot.length) break;
    for (const e of lot) {
      total++;
      if (String(e.created_at).slice(0, 10) === jour) {
        aujourdhui++;
        const s = String(e.subject || "").slice(0, 42);
        sujets.set(s, (sujets.get(s) || 0) + 1);
      } else { fini = true; break; }
    }
    apres = lot[lot.length - 1]?.id;
  }
  console.log(`envoyes aujourd'hui (${jour}) : ${aujourdhui} / 100`);
  console.log(`place restante                : ${Math.max(0, 100 - aujourdhui)}`);
  console.log(`\npar sujet :`);
  [...sujets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
    .forEach(([s, n]) => console.log(`   ${String(n).padStart(3)}  ${s}`));
})();
