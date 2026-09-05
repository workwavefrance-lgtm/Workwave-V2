import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import Anthropic from "@anthropic-ai/sdk";
(async () => {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const r = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 10,
      messages: [{ role: "user", content: "dis ok" }],
    });
    console.log("✅ CLÉ OK : crédits disponibles. Réponse:", r.content[0].type === "text" ? (r.content[0] as { text: string }).text : "?");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log("❌ ERREUR API:", msg.slice(0, 200));
  }
})();
