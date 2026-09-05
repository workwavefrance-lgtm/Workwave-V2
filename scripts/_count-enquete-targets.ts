import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Blacklist (emails à exclure absolument)
  const { data: bl } = await sb.from("email_blacklist").select("email");
  const blset = new Set((bl || []).map(b => (b.email || "").toLowerCase()));
  console.log(`email_blacklist : ${blset.size} emails\n`);

  // GROUPE A : pros RÉCLAMÉS avec email (warm, ont créé un compte)
  const { data: claimed } = await sb.from("pros")
    .select("id, name, email, do_not_contact, source")
    .not("claimed_by_user_id", "is", null).eq("is_active", true).is("deleted_at", null)
    .not("email", "is", null).neq("email", "");
  const claimedOk = (claimed || []).filter(p => p.email && !p.do_not_contact && !blset.has(p.email.toLowerCase()));
  console.log(`GROUPE A · pros réclamés avec email : ${claimed?.length || 0} (après filtres : ${claimedOk.length})`);

  // GROUPE B : pros NON réclamés avec email (cold, scrapés/enrichis)
  // count exact via pagination pour éviter le cap 1000
  let coldTotal = 0; let offset = 0;
  const coldEmails = new Set<string>();
  while (true) {
    const { data } = await sb.from("pros")
      .select("email, do_not_contact")
      .is("claimed_by_user_id", null).eq("is_active", true).is("deleted_at", null)
      .not("email", "is", null).neq("email", "")
      .range(offset, offset + 999);
    const rows = data || [];
    if (rows.length === 0) break;
    for (const r of rows) {
      coldTotal++;
      const e = (r.email || "").toLowerCase();
      if (!r.do_not_contact && !blset.has(e)) coldEmails.add(e);
    }
    offset += rows.length;
  }
  console.log(`GROUPE B · pros NON réclamés avec email : ${coldTotal} (uniques contactables après filtres : ${coldEmails.size})`);
  console.log(`\nTOTAL contactable : ${claimedOk.length + coldEmails.size} emails`);
}
main().catch(e => { console.error(e.message); process.exit(1); });
