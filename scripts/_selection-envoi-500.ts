/**
 * SELECTION des destinataires du premier envoi de prospection. AUCUN ENVOI ICI.
 *
 * Verifie, dans l'ordre :
 *  1. combien des fiches enrichies RGE ont un CHANTIER OUVERT de leur metier
 *     a moins de 40 km (le mail l'affirme, il ne doit pas mentir) ;
 *  2. les exclusions obligatoires (blacklist, do_not_contact, bounce, deja
 *     reclamee, deja contactee) ;
 *  3. les emails MUTUALISES : une meme adresse couvrant plusieurs entreprises
 *     (cjoveneau@iziconfort.fr couvre 41 societes). Envoyer un mail nominatif
 *     a une adresse partagee expose les donnees d'une entreprise a une autre.
 */
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const hav = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * r, dLon = (b.longitude - a.longitude) * r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * r) * Math.cos(b.latitude * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

const EMAIL_OK = /^[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}$/i;

(async () => {
  // --- chantiers ouverts, avec leur ville geolocalisee
  const { data: projets, error: ep } = await sb
    .from("projects")
    .select("id, category_id, city_id, urgency, created_at, categories(name), cities(name, postal_code, latitude, longitude)")
    .eq("vertical", "btp")
    .not("status", "in", "(closed,deleted)");
  if (ep) { console.error("ERREUR projets:", ep.message); process.exit(1); }
  const ouverts = (projets || []) as unknown as {
    id: number; category_id: number; urgency: string; created_at: string;
    categories: { name: string } | null;
    cities: { name: string; postal_code: string; latitude: number; longitude: number } | null;
  }[];
  console.log(`chantiers ouverts : ${ouverts.length}`);

  // --- fiches enrichies RGE, retrouvees par SIRET
  // (on ne se sert PAS du journal d'enrichissement : il est reecrit a chaque
  // execution du script d'enrichissement, donc il ne contient que le dernier
  // lot. Le fichier RGE, lui, est la source stable.)
  const propre = (v: string) => (v || "").replace(/[\u0000-\u001f]/g, "").replace(/^"+|"+$/g, "").trim();
  const sirets = fs.readFileSync("/tmp/rge/rge-actuel.csv", "utf8")
    .trim().split("\n").slice(1).map((l) => propre(l.split(";")[0])).filter(Boolean);
  console.log(`SIRET RGE : ${sirets.length}`);

  const ids: number[] = [];
  for (let i = 0; i < sirets.length; i += 500) {
    const { data, error } = await sb.from("pros").select("id")
      .in("siret", sirets.slice(i, i + 500))
      .eq("is_active", true).is("deleted_at", null);
    if (error) { console.error("ERREUR siret:", error.message); process.exit(1); }
    (data || []).forEach((p: { id: number }) => ids.push(p.id));
  }
  console.log(`fiches Workwave correspondantes : ${ids.length}`);

  let avecChantier = 0, sansChantier = 0;
  const eligibles: Record<string, unknown>[] = [];
  const compteurEmail = new Map<string, number>();

  for (let i = 0; i < ids.length; i += 500) {
    const { data, error } = await sb
      .from("pros")
      .select("id, name, slug, email, category_id, claimed_by_user_id, do_not_contact, email_bounced, intervention_radius_km, cities(name, latitude, longitude), categories(name)")
      .in("id", ids.slice(i, i + 500))
      .eq("is_active", true).is("deleted_at", null);
    if (error) { console.error("ERREUR pros:", error.message); process.exit(1); }
    for (const p of (data || []) as unknown as {
      id: number; name: string; slug: string; email: string | null; category_id: number;
      claimed_by_user_id: string | null; do_not_contact: boolean | null; email_bounced: boolean | null;
      cities: { name: string; latitude: number; longitude: number } | null;
      categories: { name: string } | null;
    }[]) {
      if (p.claimed_by_user_id || p.do_not_contact || p.email_bounced) continue;
      const mail = (p.email || "").trim().toLowerCase();
      if (!mail || !EMAIL_OK.test(mail)) continue;
      compteurEmail.set(mail, (compteurEmail.get(mail) || 0) + 1);
      if (!p.cities?.latitude) continue;

      // chantier ouvert du MEME metier a moins de 40 km
      let meilleur: (typeof ouverts)[number] | null = null;
      let meilleureDist = 1e9;
      for (const pj of ouverts) {
        if (pj.category_id !== p.category_id || !pj.cities?.latitude) continue;
        const d = hav(pj.cities, p.cities);
        if (d <= 40 && d < meilleureDist) { meilleureDist = d; meilleur = pj; }
      }
      if (meilleur) {
        avecChantier++;
        eligibles.push({
          pro_id: p.id, nom: p.name, slug: p.slug, email: mail,
          metier: p.categories?.name, ville: p.cities.name,
          projet_id: meilleur.id, projet_ville: meilleur.cities!.name,
          projet_cp: meilleur.cities!.postal_code, projet_metier: meilleur.categories?.name,
          km: Math.round(meilleureDist), urgence: meilleur.urgency,
          jours: Math.floor((Date.now() - new Date(meilleur.created_at).getTime()) / 86400e3),
        });
      } else sansChantier++;
    }
    if ((i / 500) % 20 === 0) console.log(`   ${i + 500}/${ids.length}...`);
  }

  console.log(`\n--- APPARIEMENT AVEC UN CHANTIER OUVERT ---`);
  console.log(`  avec chantier de leur metier a <= 40 km : ${avecChantier}`);
  console.log(`  sans aucun chantier                     : ${sansChantier}`);

  // emails mutualises
  const mutualises = new Set([...compteurEmail.entries()].filter(([, n]) => n > 1).map(([e]) => e));
  const propres = eligibles.filter((e) => !mutualises.has(e.email as string));
  console.log(`\n  adresses mutualisees (plusieurs entreprises) : ${mutualises.size}`);
  console.log(`  eligibles apres retrait des mutualisees      : ${propres.length}`);

  fs.writeFileSync("/tmp/rge/eligibles-envoi.json", JSON.stringify(propres, null, 2));
  console.log(`\necrit : /tmp/rge/eligibles-envoi.json`);
  if (propres.length) {
    console.log(`\nexemples :`);
    propres.slice(0, 5).forEach((e) =>
      console.log(`   ${String(e.nom).slice(0, 28).padEnd(30)} ${String(e.metier).slice(0, 14).padEnd(15)} chantier #${e.projet_id} a ${e.km} km, ${e.jours} j`)
    );
  }
})();
