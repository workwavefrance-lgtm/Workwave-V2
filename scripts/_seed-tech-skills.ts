/**
 * One-shot Phase 9 bis : seed 30 skills Tier 1 tech dans categories
 * avec parent_category_id pointant vers les 6 macros existantes (43-48).
 *
 * Resultat : 6 macros + 30 skills = 36 categories tech.
 * Avec 60 villes = 36 x 60 = 2160 pages SEO programmatiques.
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

type SkillSeed = {
  slug: string;
  name: string;
  parent_slug: string;
  popularity: number; // 100=very high, 80=high, 60=medium
  description: string;
  seo_keywords: string[];
};

const SKILLS: SkillSeed[] = [
  // ─── developpement-web (id 43) ──────────────────────────────────────
  { slug: "react", name: "React", parent_slug: "developpement-web", popularity: 100, description: "Freelances React experts : composants reutilisables, hooks, Next.js, integrations API.", seo_keywords: ["react", "freelance react", "developpeur react", "react.js"] },
  { slug: "vue", name: "Vue.js", parent_slug: "developpement-web", popularity: 90, description: "Freelances Vue.js : composition API, Nuxt, Pinia, ecosysteme Vue 3.", seo_keywords: ["vue", "vue.js", "vue 3", "nuxt"] },
  { slug: "angular", name: "Angular", parent_slug: "developpement-web", popularity: 80, description: "Freelances Angular : RxJS, NgRx, TypeScript, applications enterprise.", seo_keywords: ["angular", "angular freelance", "rxjs", "ngrx"] },
  { slug: "next-js", name: "Next.js", parent_slug: "developpement-web", popularity: 95, description: "Freelances Next.js : App Router, Server Components, ISR, deploiement Vercel.", seo_keywords: ["next.js", "next js", "nextjs", "server components"] },
  { slug: "node-js", name: "Node.js", parent_slug: "developpement-web", popularity: 95, description: "Freelances Node.js : Express, Nest.js, Fastify, microservices, API REST/GraphQL.", seo_keywords: ["node.js", "nodejs", "node js", "express", "nestjs"] },
  { slug: "typescript", name: "TypeScript", parent_slug: "developpement-web", popularity: 90, description: "Freelances TypeScript : type safety, generics, large codebases, refactoring.", seo_keywords: ["typescript", "ts", "type safety"] },
  { slug: "javascript", name: "JavaScript", parent_slug: "developpement-web", popularity: 95, description: "Freelances JavaScript : ES2025+, async/await, optimization, polyfills.", seo_keywords: ["javascript", "js", "es2025"] },
  { slug: "php", name: "PHP", parent_slug: "developpement-web", popularity: 80, description: "Freelances PHP : Laravel, Symfony, WordPress, performance, securite.", seo_keywords: ["php", "php 8", "developpeur php"] },
  { slug: "python", name: "Python", parent_slug: "developpement-web", popularity: 100, description: "Freelances Python : Django, FastAPI, scripts data, automation, ML.", seo_keywords: ["python", "django", "fastapi", "python freelance"] },
  { slug: "java", name: "Java", parent_slug: "developpement-web", popularity: 80, description: "Freelances Java : Spring Boot, microservices, JVM, applications enterprise.", seo_keywords: ["java", "spring", "spring boot", "jvm"] },
  { slug: "laravel", name: "Laravel", parent_slug: "developpement-web", popularity: 80, description: "Freelances Laravel : Eloquent, Livewire, Nova, Inertia, MVC PHP.", seo_keywords: ["laravel", "php laravel", "laravel freelance"] },
  { slug: "symfony", name: "Symfony", parent_slug: "developpement-web", popularity: 75, description: "Freelances Symfony : Doctrine, Twig, applications metier enterprise.", seo_keywords: ["symfony", "php symfony"] },
  { slug: "wordpress", name: "WordPress", parent_slug: "developpement-web", popularity: 95, description: "Freelances WordPress : themes custom, plugins, WooCommerce, performance.", seo_keywords: ["wordpress", "wp", "freelance wordpress"] },
  { slug: "shopify", name: "Shopify", parent_slug: "developpement-web", popularity: 90, description: "Freelances Shopify : themes Liquid, apps, integrations, e-commerce.", seo_keywords: ["shopify", "freelance shopify", "shopify dev"] },
  { slug: "react-native", name: "React Native", parent_slug: "developpement-web", popularity: 90, description: "Freelances React Native : iOS + Android cross-platform, Expo, navigation.", seo_keywords: ["react native", "mobile cross-platform"] },
  { slug: "flutter", name: "Flutter", parent_slug: "developpement-web", popularity: 85, description: "Freelances Flutter : Dart, widgets, integration native, performance mobile.", seo_keywords: ["flutter", "dart", "freelance flutter"] },
  { slug: "webflow", name: "Webflow", parent_slug: "no-code-automation", popularity: 85, description: "Freelances Webflow : sites premium, CMS, animations, integrations no-code.", seo_keywords: ["webflow", "no-code website"] },

  // ─── intelligence-artificielle (id 44) ──────────────────────────────
  { slug: "chatgpt", name: "ChatGPT Integration", parent_slug: "intelligence-artificielle", popularity: 100, description: "Freelances integration ChatGPT : OpenAI API, function calling, embeddings.", seo_keywords: ["chatgpt", "openai", "gpt integration"] },
  { slug: "llm", name: "LLM Engineering", parent_slug: "intelligence-artificielle", popularity: 95, description: "Freelances LLM : fine-tuning, RAG, eval, deployment, multi-modal.", seo_keywords: ["llm", "large language model", "ai engineer"] },
  { slug: "rag", name: "RAG (Retrieval-Augmented)", parent_slug: "intelligence-artificielle", popularity: 90, description: "Freelances RAG : vector databases, embeddings, retrieval pipelines, AI agents.", seo_keywords: ["rag", "retrieval augmented generation", "vector db"] },
  { slug: "prompt-engineering", name: "Prompt Engineering", parent_slug: "intelligence-artificielle", popularity: 85, description: "Freelances prompt engineering : design de prompts, eval, optimisation cout/latence.", seo_keywords: ["prompt engineering", "prompt design", "ai prompt"] },
  { slug: "machine-learning", name: "Machine Learning", parent_slug: "intelligence-artificielle", popularity: 90, description: "Freelances ML : scikit-learn, PyTorch, TensorFlow, MLOps, deployment.", seo_keywords: ["machine learning", "ml", "data science"] },

  // ─── cloud-devops (id 45) ───────────────────────────────────────────
  { slug: "aws", name: "AWS", parent_slug: "cloud-devops", popularity: 100, description: "Freelances AWS : EC2, Lambda, RDS, S3, CloudFront, architectures serverless.", seo_keywords: ["aws", "amazon web services", "freelance aws"] },
  { slug: "azure", name: "Microsoft Azure", parent_slug: "cloud-devops", popularity: 85, description: "Freelances Azure : Functions, AKS, Cosmos DB, DevOps pipelines.", seo_keywords: ["azure", "microsoft azure", "freelance azure"] },
  { slug: "gcp", name: "Google Cloud (GCP)", parent_slug: "cloud-devops", popularity: 75, description: "Freelances GCP : Cloud Run, BigQuery, Pub/Sub, Firebase, Vertex AI.", seo_keywords: ["gcp", "google cloud", "vertex ai"] },
  { slug: "kubernetes", name: "Kubernetes", parent_slug: "cloud-devops", popularity: 95, description: "Freelances Kubernetes : Helm, Istio, monitoring, scaling, multi-cluster.", seo_keywords: ["kubernetes", "k8s", "kubernetes freelance"] },
  { slug: "terraform", name: "Terraform", parent_slug: "cloud-devops", popularity: 90, description: "Freelances Terraform : IaC, modules reutilisables, GitOps, multi-cloud.", seo_keywords: ["terraform", "iac", "infrastructure as code"] },
  { slug: "docker", name: "Docker", parent_slug: "cloud-devops", popularity: 90, description: "Freelances Docker : containerisation, multi-stage builds, Docker Compose, security.", seo_keywords: ["docker", "containers"] },
  { slug: "devops", name: "DevOps Generaliste", parent_slug: "cloud-devops", popularity: 95, description: "Freelances DevOps : CI/CD, infrastructure, monitoring, SRE, automation.", seo_keywords: ["devops", "freelance devops", "sre"] },
  { slug: "cybersecurite", name: "Cybersecurite", parent_slug: "cloud-devops", popularity: 90, description: "Freelances cybersecurite : pentest, audit, GDPR, ISO 27001, SOC.", seo_keywords: ["cybersecurite", "pentest", "security"] },
];

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Charge le mapping parent_slug → id
  const { data: parents } = await sb
    .from("categories")
    .select("id, slug")
    .eq("vertical", "tech")
    .is("parent_category_id", null);

  const parentIdBySlug = new Map<string, number>();
  parents?.forEach((p) => parentIdBySlug.set(p.slug, p.id));

  console.log(`✓ ${parentIdBySlug.size} macro-categories tech detectees`);

  // 2. Construit payload + upsert
  const payload = SKILLS.map((s) => {
    const parentId = parentIdBySlug.get(s.parent_slug);
    if (!parentId) {
      console.warn(`⚠ parent slug '${s.parent_slug}' introuvable, skip ${s.slug}`);
      return null;
    }
    return {
      slug: s.slug,
      name: s.name,
      vertical: "tech",
      description: s.description,
      seo_keywords: s.seo_keywords,
      parent_category_id: parentId,
      popularity: s.popularity,
    };
  }).filter((p): p is NonNullable<typeof p> => p !== null);

  const { error } = await sb
    .from("categories")
    .upsert(payload, { onConflict: "slug", ignoreDuplicates: false })
    .select("id, slug");

  if (error) {
    console.error("❌ Insert error:", error);
    process.exit(1);
  }

  // 3. Verify
  const { count } = await sb
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("vertical", "tech")
    .not("parent_category_id", "is", null);

  console.log(`✓ ${count} skills tech en base (parent_category_id IS NOT NULL)`);
  console.log(`✓ Total categories tech : 6 macros + ${count} skills = ${6 + (count || 0)}`);
  console.log(`✓ Pages SEO programmatiques : ${6 + (count || 0)} cats x 60 villes = ${(6 + (count || 0)) * 60} pages`);
}

main().catch((e) => { console.error(e); process.exit(1); });
