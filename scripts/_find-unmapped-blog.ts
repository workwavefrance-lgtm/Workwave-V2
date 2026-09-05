import { config } from "dotenv";
import path from "path";
import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: blogs } = await sb.from("blog_posts").select("slug,title").ilike("slug", "%prix%").eq("status", "published").order("slug");
  const nextConfig = fs.readFileSync("next.config.ts", "utf-8");
  const unmapped: { slug: string; title: string }[] = [];
  for (const b of blogs || []) {
    if (!nextConfig.includes(`/blog/${b.slug}`)) {
      unmapped.push(b as { slug: string; title: string });
    }
  }
  console.log(`Total articles 'prix' en base : ${blogs?.length}`);
  console.log(`Articles SANS 301 (live + cannibalisation potentielle) : ${unmapped.length}\n`);
  for (const u of unmapped) {
    console.log(`  /blog/${u.slug}`);
    console.log(`    → titre : ${u.title}`);
    // Tente une suggestion de guide cible
    const probable = u.slug.replace(/-(en|a|de|du|le|la)-/g, "-").match(/(piscine|ramonage|carrelage|peinture|isolation|chaudiere|pompe|terrasse|porte|fenetre|cuisine|placo|granules|debouchage|alarme|nettoyage|electricien|plombier|vitrier|ite|dpe|rge|maprimerenov|toiture|maison)/g);
    if (probable) console.log(`    → mots-clés détectés : ${probable.join(", ")}`);
    console.log();
  }
}
main();
