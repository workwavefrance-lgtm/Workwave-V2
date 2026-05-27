import dotenv from "dotenv";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

async function tryModel(model: string) {
  try {
    const r = await client.messages.create({
      model,
      max_tokens: 50,
      system: "Reply with one word",
      messages: [{ role: "user", content: "hi" }],
    });
    const txt = r.content[0]?.type === "text" ? r.content[0].text : "";
    console.log(`✓ ${model} OK : "${txt}"`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`✗ ${model} FAIL : ${msg.slice(0, 100)}`);
  }
}

async function main() {
  await tryModel("claude-sonnet-4-6");
  await tryModel("claude-sonnet-4-5");
  await tryModel("claude-opus-4-5");
  await tryModel("claude-haiku-4-5");
  await tryModel("claude-3-5-sonnet-20241022");
}
main();
