/**
 * Genere 200 articles de blog tech long-tail pour Workwave AI via Claude
 * Sonnet 4-6. Sujets categorises en 7 types : choisir-freelance, tjm-stack,
 * top-freelances, guide-pratique, comparatif, glossaire-ia, ressource-stack.
 *
 * Insere dans blog_posts avec status='draft' (l'admin publie apres review).
 * Tags = ['workwave-ai', skillSlug] pour identifier les articles tech.
 *
 * Coût estime : ~10$ pour 200 articles (claude-sonnet-4-5 a ~5$/M tokens
 * input + ~25$/M output, ~3K tokens output par article = 0.075$/article).
 *
 * Temps estime : ~100 minutes (200 articles × 30s/article avec rate limit).
 *
 * Usage :
 *   npx tsx scripts/generate-ai-blog-articles.ts --dry-run             # liste les 200 sujets
 *   npx tsx scripts/generate-ai-blog-articles.ts --limit=10            # genere les 10 premiers
 *   npx tsx scripts/generate-ai-blog-articles.ts --apply               # lance les 200 en prod
 *   npx tsx scripts/generate-ai-blog-articles.ts --apply --skip=50     # reprend a partir du 50
 *   npx tsx scripts/generate-ai-blog-articles.ts --apply --category=tjm-stack
 */
import { config } from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import {
  generateAiBlogArticle,
  type AiBlogTopicType,
} from "../lib/ai/generate-ai-blog";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Topic = {
  topicType: AiBlogTopicType;
  title: string;
  skillName: string;
  skillSlug: string;
  contextHint?: string;
  cityName?: string;
};

// ─────────────────────────────────────────────────────────────────────
// A. CHOISIR UN FREELANCE X — 40 sujets
// ─────────────────────────────────────────────────────────────────────
const CHOISIR_FREELANCE: Array<{ skill: string; slug: string; ctx?: string }> = [
  { skill: "React", slug: "react" },
  { skill: "Next.js", slug: "nextjs" },
  { skill: "Vue.js", slug: "vuejs" },
  { skill: "Angular", slug: "angular" },
  { skill: "Node.js", slug: "nodejs" },
  { skill: "Python", slug: "python" },
  { skill: "Django", slug: "django" },
  { skill: "Flask / FastAPI", slug: "flask-fastapi" },
  { skill: "Laravel", slug: "laravel" },
  { skill: "Symfony", slug: "symfony" },
  { skill: "PHP", slug: "php" },
  { skill: "Java / Spring", slug: "java-spring" },
  { skill: "Go", slug: "golang" },
  { skill: "Rust", slug: "rust" },
  { skill: "TypeScript", slug: "typescript" },
  { skill: "C# / .NET", slug: "csharp-dotnet" },
  { skill: "Ruby on Rails", slug: "rails" },
  { skill: "AWS", slug: "aws" },
  { skill: "GCP (Google Cloud)", slug: "gcp" },
  { skill: "Azure", slug: "azure" },
  { skill: "Kubernetes", slug: "kubernetes" },
  { skill: "Docker", slug: "docker" },
  { skill: "Terraform", slug: "terraform" },
  { skill: "DevOps", slug: "devops" },
  { skill: "SRE", slug: "sre" },
  { skill: "Data Engineer", slug: "data-engineer" },
  { skill: "ML Engineer", slug: "ml-engineer" },
  { skill: "Ingenieur IA / LLM", slug: "ia-llm" },
  { skill: "RAG / Search semantique", slug: "rag-search" },
  { skill: "Computer Vision", slug: "computer-vision" },
  { skill: "NLP", slug: "nlp" },
  { skill: "Designer UX / UI", slug: "ux-ui" },
  { skill: "Designer produit", slug: "design-produit" },
  { skill: "Figma", slug: "figma" },
  { skill: "Webflow", slug: "webflow" },
  { skill: "Bubble", slug: "bubble" },
  { skill: "Make / Zapier", slug: "make-zapier" },
  { skill: "n8n", slug: "n8n" },
  { skill: "React Native", slug: "react-native" },
  { skill: "Flutter", slug: "flutter" },
];

// ─────────────────────────────────────────────────────────────────────
// B. TJM STACK 2026 — 30 sujets
// ─────────────────────────────────────────────────────────────────────
const TJM_STACK: Array<{ skill: string; slug: string }> = [
  { skill: "React", slug: "react" },
  { skill: "Next.js", slug: "nextjs" },
  { skill: "Vue.js", slug: "vuejs" },
  { skill: "Angular", slug: "angular" },
  { skill: "Node.js", slug: "nodejs" },
  { skill: "Python", slug: "python" },
  { skill: "Java / Spring", slug: "java-spring" },
  { skill: "PHP / Laravel", slug: "php-laravel" },
  { skill: "Go", slug: "golang" },
  { skill: "Rust", slug: "rust" },
  { skill: "TypeScript", slug: "typescript" },
  { skill: "AWS", slug: "aws" },
  { skill: "GCP", slug: "gcp" },
  { skill: "Azure", slug: "azure" },
  { skill: "Kubernetes", slug: "kubernetes" },
  { skill: "DevOps", slug: "devops" },
  { skill: "Data Engineer", slug: "data-engineer" },
  { skill: "ML Engineer", slug: "ml-engineer" },
  { skill: "Ingenieur IA / LLM", slug: "ia-llm" },
  { skill: "Mobile React Native", slug: "react-native" },
  { skill: "Flutter", slug: "flutter" },
  { skill: "iOS / Swift", slug: "ios-swift" },
  { skill: "Android / Kotlin", slug: "android-kotlin" },
  { skill: "Designer UX / UI", slug: "ux-ui" },
  { skill: "Designer Figma", slug: "figma" },
  { skill: "Product Manager", slug: "product-manager" },
  { skill: "Tech Lead", slug: "tech-lead" },
  { skill: "Architecte logiciel", slug: "architecte" },
  { skill: "SecOps / Cyber", slug: "secops" },
  { skill: "Cloud Architect", slug: "cloud-architect" },
];

// ─────────────────────────────────────────────────────────────────────
// C. TOP FREELANCES X EN FRANCE — 25 sujets (avec ville si pertinent)
// ─────────────────────────────────────────────────────────────────────
const TOP_FREELANCES: Array<{ skill: string; slug: string; city?: string }> = [
  { skill: "React", slug: "react", city: "Paris" },
  { skill: "Python", slug: "python", city: "Paris" },
  { skill: "Ingenieur IA / LLM", slug: "ia-llm", city: "Paris" },
  { skill: "AWS", slug: "aws", city: "Paris" },
  { skill: "Data Engineer", slug: "data-engineer", city: "Paris" },
  { skill: "React", slug: "react", city: "Lyon" },
  { skill: "React", slug: "react", city: "Bordeaux" },
  { skill: "Ingenieur IA / LLM", slug: "ia-llm", city: "Lyon" },
  { skill: "Ingenieur IA / LLM", slug: "ia-llm", city: "Bordeaux" },
  { skill: "DevOps", slug: "devops", city: "Paris" },
  { skill: "DevOps", slug: "devops", city: "Lyon" },
  { skill: "Designer UX / UI", slug: "ux-ui", city: "Paris" },
  { skill: "Designer UX / UI", slug: "ux-ui", city: "Lyon" },
  { skill: "Designer Figma", slug: "figma", city: "Paris" },
  { skill: "React (remote)", slug: "react-remote" },
  { skill: "Python (remote)", slug: "python-remote" },
  { skill: "Mobile React Native", slug: "react-native", city: "Paris" },
  { skill: "No-code Bubble", slug: "bubble" },
  { skill: "Webflow", slug: "webflow" },
  { skill: "Web design", slug: "webdesign" },
  { skill: "Java", slug: "java", city: "Paris" },
  { skill: "Rust", slug: "rust" },
  { skill: "Tech Lead", slug: "tech-lead" },
  { skill: "Architecte logiciel", slug: "architecte" },
  { skill: "Product Manager", slug: "pm" },
];

// ─────────────────────────────────────────────────────────────────────
// D. GUIDE PRATIQUE — 35 sujets
// ─────────────────────────────────────────────────────────────────────
const GUIDE_PRATIQUE: Array<{ title: string; skill: string; slug: string; ctx?: string }> = [
  { title: "Comment construire son MVP en startup tech en 2026 : guide complet", skill: "MVP startup", slug: "mvp-startup" },
  { title: "Migrer un monolithe vers une architecture micro-services : guide", skill: "Architecture", slug: "microservices" },
  { title: "Migration cloud AWS : strategie 6R, etapes, pieges en 2026", skill: "AWS Migration", slug: "aws-migration" },
  { title: "Migration cloud GCP : approche, services cles, retour d'experience", skill: "GCP Migration", slug: "gcp-migration" },
  { title: "Setup CI/CD pour une equipe tech en 2026 : outils et bonnes pratiques", skill: "CI/CD", slug: "cicd-setup" },
  { title: "Setup Kubernetes pour une PME : managed vs self-hosted en 2026", skill: "Kubernetes", slug: "k8s-setup" },
  { title: "Infra-as-Code avec Terraform : guide pratique pour debuter", skill: "Terraform", slug: "terraform-guide" },
  { title: "Architecture serverless en 2026 : quand l'utiliser, quand l'eviter", skill: "Serverless", slug: "serverless" },
  { title: "Architecture event-driven : guide pratique avec Kafka, RabbitMQ, SNS", skill: "Event-driven", slug: "event-driven" },
  { title: "Mettre en place l'observabilite (logs, metrics, traces) en 2026", skill: "Observabilite", slug: "observability" },
  { title: "Construire un systeme RAG avec LangChain en 2026 : tutoriel", skill: "RAG LangChain", slug: "rag-langchain" },
  { title: "Build un agent IA autonome avec OpenAI / Claude en 2026", skill: "Agent IA", slug: "ai-agent" },
  { title: "Fine-tuning d'un LLM open-source en 2026 : guide pratique", skill: "Fine-tuning LLM", slug: "fine-tuning-llm" },
  { title: "Embedding pour la recherche semantique : OpenAI vs alternatives", skill: "Embedding search", slug: "embeddings" },
  { title: "Construire un chatbot avec OpenAI API : tutoriel complet 2026", skill: "Chatbot OpenAI", slug: "chatbot-openai" },
  { title: "Developper une app mobile cross-platform avec React Native en 2026", skill: "React Native", slug: "react-native-guide" },
  { title: "Developper une app mobile avec Flutter en 2026 : guide debutant", skill: "Flutter", slug: "flutter-guide" },
  { title: "PWA vs application native en 2026 : quel choix pour quel besoin", skill: "PWA vs native", slug: "pwa-vs-native" },
  { title: "Construire un SaaS B2B en 2026 : stack, architecture, monetisation", skill: "SaaS B2B", slug: "saas-b2b" },
  { title: "Lancer un MVP no-code avec Bubble en 30 jours : guide pratique", skill: "Bubble MVP", slug: "bubble-mvp" },
  { title: "Automation business avec Make et Zapier : 10 cas d'usage 2026", skill: "Make Zapier", slug: "make-zapier-cases" },
  { title: "Setup un data warehouse moderne en 2026 : BigQuery, Snowflake, Redshift", skill: "Data warehouse", slug: "data-warehouse" },
  { title: "BI moderne en 2026 : Looker, Tableau, Metabase, Power BI compares", skill: "BI tools", slug: "bi-tools" },
  { title: "ETL en Python : Airflow, dbt, Prefect compares en 2026", skill: "ETL Python", slug: "etl-python" },
  { title: "Architecture webhook pour SaaS : retry, idempotence, signature", skill: "Webhook", slug: "webhook-architecture" },
  { title: "GraphQL vs REST API : quel choix pour votre projet en 2026", skill: "GraphQL vs REST", slug: "graphql-vs-rest" },
  { title: "Migrer une app Next.js Pages vers App Router en 2026 : guide", skill: "Next.js App Router", slug: "nextjs-app-router" },
  { title: "Server Components React en 2026 : ce qui change vraiment", skill: "Server Components", slug: "server-components" },
  { title: "Integration Stripe pour SaaS B2B en 2026 : webhooks, abonnements, TVA", skill: "Stripe integration", slug: "stripe-integration" },
  { title: "Authentification moderne : NextAuth, Clerk, Auth0 compares 2026", skill: "Auth moderne", slug: "auth-comparison" },
  { title: "Choix de base de donnees en 2026 : PostgreSQL, MongoDB, ou autres", skill: "DB choice", slug: "db-choice" },
  { title: "Cache Redis en production : 5 patterns indispensables en 2026", skill: "Redis", slug: "redis-patterns" },
  { title: "CDN Cloudflare vs Vercel vs AWS CloudFront en 2026", skill: "CDN comparison", slug: "cdn-comparison" },
  { title: "Configuration DNS pour SaaS : domaines, sous-domaines, SPF/DKIM", skill: "DNS DNS DKIM", slug: "dns-config" },
  { title: "SSL / TLS en 2026 : Let's Encrypt, mTLS, certificats EV", skill: "SSL TLS", slug: "ssl-tls" },
];

// ─────────────────────────────────────────────────────────────────────
// E. COMPARATIFS — 35 sujets
// ─────────────────────────────────────────────────────────────────────
const COMPARATIFS: Array<{ a: string; b: string; slug: string }> = [
  { a: "React", b: "Vue.js", slug: "react-vs-vue" },
  { a: "React", b: "Angular", slug: "react-vs-angular" },
  { a: "Next.js", b: "Remix", slug: "nextjs-vs-remix" },
  { a: "Next.js", b: "Astro", slug: "nextjs-vs-astro" },
  { a: "Node.js", b: "Python (backend)", slug: "nodejs-vs-python" },
  { a: "Python", b: "JavaScript", slug: "python-vs-javascript" },
  { a: "Django", b: "Flask / FastAPI", slug: "django-vs-flask" },
  { a: "Laravel", b: "Symfony", slug: "laravel-vs-symfony" },
  { a: "AWS", b: "GCP", slug: "aws-vs-gcp" },
  { a: "AWS", b: "Azure", slug: "aws-vs-azure" },
  { a: "Kubernetes", b: "Nomad", slug: "k8s-vs-nomad" },
  { a: "Docker", b: "Podman", slug: "docker-vs-podman" },
  { a: "Terraform", b: "Pulumi", slug: "terraform-vs-pulumi" },
  { a: "MongoDB", b: "PostgreSQL", slug: "mongodb-vs-postgresql" },
  { a: "Redis", b: "Memcached", slug: "redis-vs-memcached" },
  { a: "OpenAI GPT-4", b: "Anthropic Claude", slug: "openai-vs-claude" },
  { a: "LLaMA", b: "GPT-4", slug: "llama-vs-gpt4" },
  { a: "Pinecone", b: "Qdrant", slug: "pinecone-vs-qdrant" },
  { a: "Bubble", b: "Webflow", slug: "bubble-vs-webflow" },
  { a: "Make (ex-Integromat)", b: "Zapier", slug: "make-vs-zapier" },
  { a: "n8n", b: "Make", slug: "n8n-vs-make" },
  { a: "Notion", b: "Airtable", slug: "notion-vs-airtable" },
  { a: "React Native", b: "Flutter", slug: "react-native-vs-flutter" },
  { a: "iOS Swift", b: "Android Kotlin", slug: "ios-vs-android-dev" },
  { a: "Figma", b: "Sketch", slug: "figma-vs-sketch" },
  { a: "Vercel", b: "Netlify", slug: "vercel-vs-netlify" },
  { a: "AWS Amplify", b: "Vercel", slug: "amplify-vs-vercel" },
  { a: "GitLab", b: "GitHub", slug: "gitlab-vs-github" },
  { a: "Linear", b: "Jira", slug: "linear-vs-jira" },
  { a: "Discord", b: "Slack (equipes dev)", slug: "discord-vs-slack" },
  { a: "Stripe", b: "Lemon Squeezy", slug: "stripe-vs-lemonsqueezy" },
  { a: "PostgreSQL", b: "MySQL", slug: "postgresql-vs-mysql" },
  { a: "GraphQL", b: "REST API", slug: "graphql-vs-rest-comp" },
  { a: "REST", b: "WebSocket", slug: "rest-vs-websocket" },
  { a: "SSR (Server-Side Rendering)", b: "SSG (Static Site Generation)", slug: "ssr-vs-ssg" },
];

// ─────────────────────────────────────────────────────────────────────
// F. GLOSSAIRE IA / LLM — 25 sujets
// ─────────────────────────────────────────────────────────────────────
const GLOSSAIRE_IA: Array<{ title: string; slug: string }> = [
  { title: "Qu'est-ce qu'un LLM (Large Language Model) ?", slug: "llm-definition" },
  { title: "RAG (Retrieval-Augmented Generation) explique simplement", slug: "rag-explained" },
  { title: "Vector embedding : definition, usages, exemples concrets", slug: "vector-embedding" },
  { title: "Fine-tuning vs RAG : quel choix pour votre projet IA ?", slug: "fine-tuning-vs-rag" },
  { title: "Prompt engineering : guide pratique 2026", slug: "prompt-engineering" },
  { title: "Function calling avec un LLM : tutoriel et cas d'usage", slug: "function-calling" },
  { title: "Tool use : permettre au LLM d'utiliser des outils externes", slug: "tool-use" },
  { title: "Agents autonomes IA : architecture, frameworks, limites en 2026", slug: "ai-agents" },
  { title: "Systemes multi-agents IA : approches et orchestration", slug: "multi-agent" },
  { title: "Computer vision en 2026 : modeles, frameworks, cas d'usage", slug: "computer-vision-2026" },
  { title: "Speech-to-text avec Whisper et alternatives en 2026", slug: "speech-to-text" },
  { title: "Text-to-speech : services et modeles open-source en 2026", slug: "text-to-speech" },
  { title: "NLP en 2026 : taches principales et frameworks", slug: "nlp-tasks" },
  { title: "Sentiment analysis avec des LLM : approche moderne 2026", slug: "sentiment-analysis" },
  { title: "Named entity recognition : approches en 2026", slug: "ner" },
  { title: "Cout token OpenAI : decryptage 2026 et optimisation", slug: "token-cost" },
  { title: "Context window LLM : qu'est-ce que c'est et comment l'optimiser", slug: "context-window" },
  { title: "Temperature LLM : effet pratique et reglages recommandes", slug: "llm-temperature" },
  { title: "Few-shot vs zero-shot prompting : quand utiliser quoi", slug: "few-shot-zero-shot" },
  { title: "Chain of thought : ameliorer le raisonnement d'un LLM", slug: "chain-of-thought" },
  { title: "ReAct prompting : framework pour LLM agents", slug: "react-prompting" },
  { title: "Self-consistency en LLM : ameliorer la fiabilite", slug: "self-consistency" },
  { title: "Tree of thoughts : approche de raisonnement complexe avec LLM", slug: "tree-of-thoughts" },
  { title: "Mixture of experts (MoE) : architecture LLM expliquee", slug: "mixture-of-experts" },
  { title: "Distillation de modeles LLM : approches et resultats 2026", slug: "model-distillation" },
];

// ─────────────────────────────────────────────────────────────────────
// G. RESSOURCES / STACK 2026 — 10 sujets
// ─────────────────────────────────────────────────────────────────────
const RESSOURCES: Array<{ title: string; slug: string }> = [
  { title: "Quelle stack pour un MVP SaaS B2B en 2026 ? Guide complet", slug: "stack-mvp-saas-b2b" },
  { title: "Quelle stack pour une app mobile cross-platform en 2026 ?", slug: "stack-app-mobile" },
  { title: "Stack moderne pour developpement web en 2026 : recommandations", slug: "stack-web-2026" },
  { title: "Stack data minimum viable pour une startup en 2026", slug: "stack-data-startup" },
  { title: "Stack IA pour PME en 2026 : outils accessibles et efficaces", slug: "stack-ia-pme" },
  { title: "Stack DevOps pour petite equipe en 2026 : pragmatique", slug: "stack-devops-petite" },
  { title: "Stack outils pour designer freelance en 2026", slug: "stack-designer" },
  { title: "Stack pour no-code maker en 2026 : assemblage optimal", slug: "stack-nocode" },
  { title: "Choix base de donnees pour SaaS en 2026 : guide decisionnel", slug: "choix-bdd-saas" },
  { title: "Modeles SaaS B2B qui marchent en 2026 : etudes de cas", slug: "modeles-saas-b2b" },
];

// ─────────────────────────────────────────────────────────────────────
// Compilation des 200 sujets
// ─────────────────────────────────────────────────────────────────────
function buildAllTopics(): Topic[] {
  const topics: Topic[] = [];

  // A. Choisir freelance (40)
  CHOISIR_FREELANCE.forEach((s) => {
    topics.push({
      topicType: "choisir-freelance",
      title: `Comment choisir un freelance ${s.skill} en 2026 : criteres, TJM, red flags`,
      skillName: s.skill,
      skillSlug: `choisir-${s.slug}`,
      contextHint: s.ctx,
    });
  });

  // B. TJM stack (30)
  TJM_STACK.forEach((s) => {
    topics.push({
      topicType: "tjm-stack",
      title: `TJM freelance ${s.skill} en 2026 : fourchettes par niveau d'experience`,
      skillName: s.skill,
      skillSlug: `tjm-${s.slug}`,
    });
  });

  // C. Top freelances (25)
  TOP_FREELANCES.forEach((s) => {
    const cityPart = s.city ? ` a ${s.city}` : "";
    topics.push({
      topicType: "top-freelances",
      title: `Comment trouver les meilleurs freelances ${s.skill}${cityPart} en 2026`,
      skillName: s.skill,
      skillSlug: `top-${s.slug}${s.city ? `-${s.city.toLowerCase()}` : ""}`,
      cityName: s.city,
    });
  });

  // D. Guide pratique (35)
  GUIDE_PRATIQUE.forEach((g) => {
    topics.push({
      topicType: "guide-pratique",
      title: g.title,
      skillName: g.skill,
      skillSlug: `guide-${g.slug}`,
      contextHint: g.ctx,
    });
  });

  // E. Comparatifs (35)
  COMPARATIFS.forEach((c) => {
    topics.push({
      topicType: "comparatif",
      title: `${c.a} vs ${c.b} en 2026 : comparatif complet pour choisir`,
      skillName: `${c.a} vs ${c.b}`,
      skillSlug: c.slug,
    });
  });

  // F. Glossaire IA (25)
  GLOSSAIRE_IA.forEach((g) => {
    topics.push({
      topicType: "glossaire-ia",
      title: g.title,
      skillName: g.title.split(":")[0].trim(),
      skillSlug: `glossaire-${g.slug}`,
    });
  });

  // G. Ressources (10)
  RESSOURCES.forEach((r) => {
    topics.push({
      topicType: "ressource-stack",
      title: r.title,
      skillName: r.title.split(":")[0].trim(),
      skillSlug: `ressource-${r.slug}`,
    });
  });

  return topics;
}

// ─────────────────────────────────────────────────────────────────────
// CLI args
// ─────────────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const apply = args.includes("--apply");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : null;
  const skipArg = args.find((a) => a.startsWith("--skip="));
  const skip = skipArg ? parseInt(skipArg.split("=")[1], 10) : 0;
  const categoryArg = args.find((a) => a.startsWith("--category="));
  const category = categoryArg ? categoryArg.split("=")[1] : null;
  return { dryRun, apply, limit, skip, category };
}

// ─────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────
async function main() {
  const { dryRun, apply, limit, skip, category } = parseArgs();

  let topics = buildAllTopics();

  if (category) {
    topics = topics.filter((t) => t.topicType === category);
    if (topics.length === 0) {
      console.error(
        `Categorie inconnue: ${category}. Choisir parmi: choisir-freelance, tjm-stack, top-freelances, guide-pratique, comparatif, glossaire-ia, ressource-stack`
      );
      process.exit(1);
    }
  }

  if (skip > 0) topics = topics.slice(skip);
  if (limit !== null) topics = topics.slice(0, limit);

  console.log(`\nMode : ${dryRun ? "DRY-RUN" : apply ? "APPLY (INSERT BDD)" : "PREVIEW (genere mais sans insert)"}`);
  console.log(`Sujets a traiter : ${topics.length}${skip > 0 ? ` (skip ${skip})` : ""}${category ? ` (categorie ${category})` : ""}\n`);

  if (dryRun) {
    topics.forEach((t, i) => {
      console.log(
        `  ${String(skip + i + 1).padStart(3)}. [${t.topicType.padEnd(20)}] ${t.title}`
      );
    });
    console.log(`\nTotal: ${topics.length} sujets pour ${topics.length * 0.075}$ estime (~${Math.round((topics.length * 30) / 60)} min).`);
    return;
  }

  if (!apply) {
    console.log("Ajoutez --apply pour insérer en BDD, ou --dry-run pour juste lister.");
    process.exit(1);
  }

  let ok = 0;
  let fail = 0;
  const startTime = Date.now();

  for (let i = 0; i < topics.length; i++) {
    const t = topics[i];
    const n = skip + i + 1;
    const progress = `[${n}/${skip + topics.length}]`;

    try {
      // Skip si slug deja en BDD
      const tentativeSlug = t.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);

      const { data: existing } = await supabase
        .from("blog_posts")
        .select("id")
        .eq("slug", tentativeSlug)
        .maybeSingle();

      if (existing) {
        console.log(`${progress} ⏭  skip (deja en BDD): ${t.title.slice(0, 60)}...`);
        continue;
      }

      console.log(`${progress} 🔄 ${t.title.slice(0, 60)}...`);
      const article = await generateAiBlogArticle(t);

      const { error } = await supabase.from("blog_posts").insert({
        slug: article.slug,
        title: article.title,
        meta_description: article.metaDescription,
        content: article.content,
        category_slug: null,
        city_slug: null,
        tags: article.tags,
        author: "Workwave AI",
        status: "draft",
      });

      if (error) {
        console.error(`${progress} ✗ insert error: ${error.message}`);
        fail++;
      } else {
        const wordCount = article.content.split(/\s+/).length;
        console.log(`${progress} ✓ saved (${wordCount} mots, slug: ${article.slug})`);
        ok++;
      }
    } catch (e) {
      console.error(`${progress} ✗ ${e instanceof Error ? e.message : String(e)}`);
      fail++;
    }

    // Rate limit : Anthropic recommends spacing requests
    if (i < topics.length - 1) await new Promise((r) => setTimeout(r, 1000));
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log("\n=== Resume ===");
  console.log(`  ✓ OK     : ${ok}`);
  console.log(`  ✗ Echecs : ${fail}`);
  console.log(`  Temps    : ${Math.floor(elapsed / 60)}m${elapsed % 60}s`);
  console.log(`  Cout estime : ${(ok * 0.075).toFixed(2)}$ (Claude Sonnet 4-5)`);
  console.log(`\nLes articles sont en status='draft'. Pour les publier :`);
  console.log(`  UPDATE blog_posts SET status='published', published_at=NOW()`);
  console.log(`  WHERE author='Workwave AI' AND status='draft' AND tags @> ARRAY['workwave-ai'];`);
}

main().catch((e) => {
  console.error("Erreur fatale:", e);
  process.exit(1);
});
