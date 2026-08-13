/**
 * Bilan de la prospection, mesure EN BASE.
 * Repond a : combien envoyes aujourd'hui, combien au total, et surtout
 * combien de fiches ont ete RECLAMEES depuis le premier envoi.
 */
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

(async () => {
  // tous les envois de prospection
  const envois: { pro_id: number; created_at: string; metadata: { variante?: string } | null }[] = [];
  let off = 0;
  for (;;) {
    const { data, error } = await sb
      .from("events")
      .select("pro_id, created_at, metadata")
      .eq("event_name", "prospect_email")
      .range(off, off + 999);
    if (error) { console.error("ERREUR:", error.message); process.exit(1); }
    const r = (data || []) as typeof envois;
    if (!r.length) break;
    envois.push(...r);
    off += r.length;
  }

  const jour = (d: string) => d.slice(0, 10);
  const parJour = new Map<string, number>();
  envois.forEach((e) => parJour.set(jour(e.created_at), (parJour.get(jour(e.created_at)) || 0) + 1));

  console.log(`ENVOIS DE PROSPECTION, par jour :`);
  [...parJour.entries()].sort().forEach(([d, n]) => console.log(`   ${d} : ${n}`));
  console.log(`   TOTAL : ${envois.length}`);

  const parVariante = new Map<string, number>();
  envois.forEach((e) => {
    const v = e.metadata?.variante || "?";
    parVariante.set(v, (parVariante.get(v) || 0) + 1);
  });
  console.log(`\n   modele A : ${parVariante.get("A") || 0}   modele B : ${parVariante.get("B") || 0}`);

  // LE chiffre qui compte : combien ont reclame leur fiche depuis
  const ids = envois.map((e) => e.pro_id);
  const varianteDe = new Map(envois.map((e) => [e.pro_id, e.metadata?.variante || "?"]));
  let reclamees = 0;
  const detail: string[] = [];
  const parVarianteReclame = new Map<string, number>();
  for (let i = 0; i < ids.length; i += 500) {
    const { data, error } = await sb
      .from("pros")
      .select("id, name, email, claimed_at, slug")
      .in("id", ids.slice(i, i + 500))
      .not("claimed_at", "is", null);
    if (error) { console.error("ERREUR pros:", error.message); process.exit(1); }
    for (const p of (data || []) as unknown as { id: number; name: string; claimed_at: string; slug: string }[]) {
      reclamees++;
      const v = varianteDe.get(p.id) || "?";
      parVarianteReclame.set(v, (parVarianteReclame.get(v) || 0) + 1);
      detail.push(`   [${v}] ${p.name.slice(0, 34).padEnd(36)} reclamee le ${p.claimed_at.slice(0, 16).replace("T", " ")}`);
    }
  }

  console.log(`\n=== RESULTAT ===`);
  console.log(`fiches reclamees parmi les contactes : ${reclamees} / ${envois.length}`);
  if (envois.length) console.log(`taux de reclamation : ${((100 * reclamees) / envois.length).toFixed(2)} %`);
  if (detail.length) { console.log(); detail.forEach((d) => console.log(d)); }
  if (reclamees) {
    console.log(`\n   par modele : A ${parVarianteReclame.get("A") || 0}  B ${parVarianteReclame.get("B") || 0}`);
  }

  // desinscriptions et plaintes
  const { count: blacklistes } = await sb
    .from("pros").select("id", { count: "exact", head: true })
    .in("id", ids.slice(0, 500)).eq("do_not_contact", true);
  console.log(`\ndesinscriptions (sur les 500 premiers ids) : ${blacklistes || 0}`);
})();
