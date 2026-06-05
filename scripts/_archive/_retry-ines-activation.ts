import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { activateAiSignup } from "../lib/ai/auth/activate-signup";

async function main() {
  console.log("Tentative activation Ines (signupId=7)...\n");
  const r = await activateAiSignup({
    signupId: 7,
    firstName: "Ines",
    lastName: "Boumeddane",
    email: "dcoformalite@gmail.com",
    categorySlug: "juridique-conseil",
    bio: null,
    skills: null,
    github: null,
    linkedin: null,
    tjm: null,
    experienceYears: null,
    availability: "remote",
    location: "Paris",
  });
  console.log("Result :", JSON.stringify(r, null, 2));
}
main().catch((e) => { console.error("THROW:", e); process.exit(1); });
