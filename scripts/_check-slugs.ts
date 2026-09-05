import {config} from 'dotenv';
import path from 'path';
config({path: path.resolve(process.cwd(), '.env.local'), override: true});
import {createClient} from '@supabase/supabase-js';

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const r = await sb.from('price_guides').select('slug').eq('status', 'published').ilike('slug', '%dalle%').limit(3);
  console.log("slugs dalle:", r.data);
  const r2 = await sb.from('price_guides').select('slug').eq('status', 'published').limit(5);
  console.log("5 premiers slugs:", r2.data);
}
main();
