/** Cas limites du nouveau titre et de la nouvelle description, sur 200 fiches reelles. */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { getCategoryListing } from "../lib/utils/category-grammar";
import { descriptionFicheOuverte, titreFicheOuverte } from "../lib/seo/pro-registre";
const sb = getServiceClient();
(async () => {
  const lots: any[] = [];
  for (const f of [
    { nom: "sans ville", q: (q: any) => q.is("city_id", null) },
    { nom: "sans date de creation", q: (q: any) => q.is("founding_date", null) },
    { nom: "belges", q: (q: any) => q.eq("source", "bce") },
    { nom: "nom tres long", q: (q: any) => q.gte("id", 1) },
    { nom: "au hasard", q: (q: any) => q.gte("id", 500000) },
  ]) {
    let q = sb.from("pros").select("name, slug, founding_date, forme_juridique, categories(name, slug), cities(name, postal_code, country)")
      .eq("is_active", true).is("deleted_at", null).or("etat_admin.is.null,etat_admin.neq.F").limit(40);
    q = f.q(q);
    const { data, error } = await q;
    if (error) { console.log(`${f.nom} : ERREUR ${error.message}`); continue; }
    for (const p of (data || []) as any[]) lots.push({ cas: f.nom, p });
  }
  const pbs: string[] = [];
  let maxT = 0, maxD = 0;
  for (const { cas, p } of lots) {
    const faits = {
      nom: p.name,
      metierSingulier: getCategoryListing(p.categories.slug, p.categories.name).singular,
      ville: p.cities?.name || "",
      codePostal: p.cities?.postal_code,
      pays: p.cities?.country,
      dateCreation: p.founding_date,
      formeJuridiqueCode: p.forme_juridique,
    };
    const t = titreFicheOuverte(faits, p.categories.name, null);
    const d = descriptionFicheOuverte(faits);
    maxT = Math.max(maxT, t.length); maxD = Math.max(maxD, d.length);
    if (t.includes("undefined") || d.includes("undefined")) pbs.push(`undefined · ${cas} · ${p.slug}`);
    if (t.includes(" à .") || t.endsWith(" à ") || d.includes(" à .")) pbs.push(`ville vide mal geree · ${cas} · ${p.slug} · ${t}`);
    if (d.includes("  ")) pbs.push(`double espace · ${p.slug}`);
    if (/\ba\b d'activité/.test(d)) pbs.push(`accord ans · ${p.slug} · ${d}`);
    if (p.cities?.country === "BE" && d.includes("SIRET")) pbs.push(`SIRET sur fiche belge · ${p.slug}`);
    if (p.cities?.country !== "BE" && d.includes("BCE")) pbs.push(`BCE sur fiche francaise · ${p.slug}`);
    if (d.endsWith("...")) { /* coupure voulue */ }
  }
  console.log(`${lots.length} fiches testees · titre le plus long ${maxT} · description la plus longue ${maxD}`);
  console.log(pbs.length ? `PROBLEMES (${pbs.length}) :\n  ` + pbs.slice(0, 12).join("\n  ") : "aucun probleme detecte");
  console.log("\nexemples par cas :");
  const vus = new Set<string>();
  for (const { cas, p } of lots) {
    if (vus.has(cas)) continue; vus.add(cas);
    const faits = { nom: p.name, metierSingulier: getCategoryListing(p.categories.slug, p.categories.name).singular, ville: p.cities?.name || "", codePostal: p.cities?.postal_code, pays: p.cities?.country, dateCreation: p.founding_date, formeJuridiqueCode: p.forme_juridique };
    console.log(`\n[${cas}] ${titreFicheOuverte(faits, p.categories.name, null)}`);
    console.log(`   ${descriptionFicheOuverte(faits)}`);
  }
})();
