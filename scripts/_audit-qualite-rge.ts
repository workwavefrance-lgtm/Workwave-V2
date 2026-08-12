/**
 * Controle QUALITE des donnees ecrites par l'enrichissement RGE.
 *
 * POURQUOI : le CSV telecharge depuis l'ADEME contient des champs CITES
 * ("QUANTUM ", "email@x.fr ") et meme des octets NUL a l'interieur des valeurs.
 * Ma lecture par `split(";")` ne retire NI les guillemets NI les espaces, donc
 * des valeurs malformees ont pu etre ecrites en base.
 *
 * Les caracteres de controle sont ecrits en ECHAPPEMENT (\u0000), jamais en
 * litteral : un NUL litteral rend le fichier binaire pour git et fait rejeter
 * la commande shell (lecon du 26/05).
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

const CONTROLE = /[\u0000-\u001f]/;

(async () => {
  const j = fs
    .readFileSync("/tmp/rge/journal-enrichissement.csv", "utf8")
    .trim()
    .split("\n")
    .slice(1);
  const ids = j.map((l) => Number(l.split(";")[0]));

  let malformees = 0,
    propres = 0,
    avecNul = 0,
    avecGuillemet = 0,
    avecEspace = 0;
  const exemples: string[] = [];

  for (let i = 0; i < ids.length; i += 500) {
    const { data, error } = await sb
      .from("pros")
      .select("id, phone, email, website")
      .in("id", ids.slice(i, i + 500));
    if (error) {
      console.error("ERREUR:", error.message);
      process.exit(1);
    }
    for (const p of (data || []) as unknown as {
      id: number;
      phone: string | null;
      email: string | null;
      website: string | null;
    }[]) {
      const champs = [p.phone, p.email, p.website].filter(Boolean) as string[];
      const guillemet = champs.some((v) => v.includes('"'));
      const nul = champs.some((v) => CONTROLE.test(v));
      const espace = champs.some((v) => v !== v.trim());
      if (guillemet) avecGuillemet++;
      if (nul) avecNul++;
      if (espace) avecEspace++;
      if (guillemet || nul || espace) {
        malformees++;
        if (exemples.length < 8)
          exemples.push(
            `#${p.id} tel=${JSON.stringify(p.phone)} mail=${JSON.stringify(p.email)}`
          );
      } else propres++;
    }
    if ((i / 500) % 20 === 0)
      console.log(`   ${i + 500}/${ids.length} analysees...`);
  }

  console.log(`\nfiches enrichies analysees : ${malformees + propres}`);
  console.log(`  PROPRES                        : ${propres}`);
  console.log(`  MALFORMEES                     : ${malformees}`);
  console.log(`     dont guillemets residuels   : ${avecGuillemet}`);
  console.log(`     dont espaces non coupes     : ${avecEspace}`);
  console.log(`     dont caractere de controle  : ${avecNul}`);
  if (exemples.length) {
    console.log("\nexemples :");
    exemples.forEach((e) => console.log("   " + e));
  }
})();
