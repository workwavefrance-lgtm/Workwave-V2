import { config } from "dotenv";
import * as path from "path";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sk = process.env.STRIPE_SECRET_KEY || "";
const ws = process.env.STRIPE_WEBHOOK_SECRET || "";
const monthly = process.env.STRIPE_AI_PRICE_MONTHLY_ID || "";
const annual = process.env.STRIPE_AI_PRICE_ANNUAL_ID || "";

const skMode = sk.startsWith("sk_live_") ? "🔴 LIVE" : sk.startsWith("sk_test_") ? "🟢 TEST" : "❌ MISSING";
const wsMode = ws.startsWith("whsec_") ? "✓ defined" : "❌ MISSING";

console.log("Stripe local .env.local state:");
console.log(`  STRIPE_SECRET_KEY:               ${skMode}`);
console.log(`  STRIPE_WEBHOOK_SECRET:           ${wsMode}`);
console.log(`  STRIPE_AI_PRICE_MONTHLY_ID:      ${monthly ? monthly.slice(0, 12) + "..." : "❌ MISSING"}`);
console.log(`  STRIPE_AI_PRICE_ANNUAL_ID:       ${annual ? annual.slice(0, 12) + "..." : "❌ MISSING"}`);

console.log("\nN.B. : on ne peut PAS savoir d'ici les valeurs dans Vercel env.");
console.log("Le mode (test/live) en prod depend des env vars Vercel, pas de .env.local.");
