import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
/* eslint-disable @typescript-eslint/no-explicit-any */

// Villes touristiques (forte demande location saisonnière/Airbnb). name → dept code attendu.
const CAND: [string,string][] = [
  ["Nice","06"],["Cannes","06"],["Antibes","06"],["Menton","06"],["Grasse","06"],["Cagnes-sur-Mer","06"],
  ["Fréjus","83"],["Saint-Raphaël","83"],["Hyères","83"],["Toulon","83"],["Bandol","83"],["Sainte-Maxime","83"],["Saint-Tropez","83"],["Cavalaire-sur-Mer","83"],["Le Lavandou","83"],
  ["Cassis","13"],["La Ciotat","13"],["Marseille","13"],["Aix-en-Provence","13"],["Arles","13"],["Martigues","13"],
  ["Avignon","84"],["Cavaillon","84"],["Orange","84"],
  ["Sète","34"],["Agde","34"],["La Grande-Motte","34"],["Palavas-les-Flots","34"],["Montpellier","34"],
  ["Argelès-sur-Mer","66"],["Collioure","66"],["Canet-en-Roussillon","66"],["Perpignan","66"],
  ["Biarritz","64"],["Anglet","64"],["Bayonne","64"],["Saint-Jean-de-Luz","64"],["Hendaye","64"],["Hossegor","40"],["Capbreton","40"],["Seignosse","40"],["Mimizan","40"],
  ["Arcachon","33"],["La Teste-de-Buch","33"],["Lacanau","33"],["Andernos-les-Bains","33"],["Bordeaux","33"],
  ["La Rochelle","17"],["Royan","17"],["Saint-Palais-sur-Mer","17"],["Châtelaillon-Plage","17"],
  ["Les Sables-d'Olonne","85"],["Saint-Jean-de-Monts","85"],["Saint-Gilles-Croix-de-Vie","85"],["Noirmoutier-en-l'Île","85"],
  ["La Baule-Escoublac","44"],["Pornic","44"],["Saint-Nazaire","44"],
  ["Saint-Malo","35"],["Dinard","35"],["Cancale","35"],["Quiberon","56"],["Carnac","56"],["Vannes","56"],["Concarneau","29"],["Bénodet","29"],["Quimper","29"],
  ["Deauville","14"],["Trouville-sur-Mer","14"],["Cabourg","14"],["Honfleur","14"],
  ["Annecy","74"],["Chamonix-Mont-Blanc","74"],["Megève","74"],["Thonon-les-Bains","74"],["Chambéry","73"],["Aix-les-Bains","73"],
  ["Ajaccio","2A"],["Bastia","2B"],["Porto-Vecchio","2A"],["Calvi","2B"],
];

(async () => {
  const results: any[] = [];
  for (const [name, dept] of CAND) {
    const { data: cities } = await sb.from("cities")
      .select("id,name,slug,latitude,longitude,departments!inner(code,name)")
      .ilike("name", name).limit(5);
    const match = (cities as any[])?.find(c => c.departments?.code === dept) || (cities as any[])?.[0];
    if (!match) { results.push({name, dept, found:false}); continue; }
    // pros ménage(19)+nettoyage-pro(40)+multiservice(188) dans cette ville
    const { count } = await sb.from("pros").select("id",{count:"exact",head:true})
      .eq("city_id", match.id).in("category_id",[19,40,188]).eq("is_active",true).is("deleted_at",null);
    results.push({ name: match.name, slug: match.slug, dept: match.departments?.code, pros: count||0, found:true });
  }
  const ok = results.filter(r=>r.found && r.pros>=3).sort((a,b)=>b.pros-a.pros);
  const thin = results.filter(r=>r.found && r.pros<3);
  const missing = results.filter(r=>!r.found);
  console.log(`\n=== ✅ VILLES RETENUES (>=3 pros ménage/nettoyage) : ${ok.length} ===`);
  ok.forEach(r=>console.log(`  ${String(r.pros).padStart(4)} pros | ${r.slug.padEnd(30)} | ${r.name} (${r.dept})`));
  console.log(`\n=== ⚠️ trop peu de pros (<3), à écarter : ${thin.length} ===`);
  thin.forEach(r=>console.log(`  ${r.pros} | ${r.slug} | ${r.name} (${r.dept})`));
  console.log(`\n=== ❌ non trouvées en base : ${missing.length} ===`);
  missing.forEach(r=>console.log(`  ${r.name} (${r.dept})`));
})().catch(e=>console.error("ERR",e.message));
