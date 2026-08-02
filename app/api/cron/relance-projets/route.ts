/**
 * Cron quotidien : DEUX relances aux pros sur un projet toujours sans preneur.
 *
 *   J0    broadcast initial          -> broadcasted_at
 *   J+1   "un projet vous attend"    -> relance_j1_sent_at   (ajoute le 02/08/2026)
 *   J+3   "toujours disponible"      -> relance_sent_at
 *
 * Pourquoi deux : un pro qui ne clique pas le jour meme oublie. La relance a
 * 24 h le rattrape quand le particulier attend encore ses devis — c'est la que
 * se declenchent les deblocages a 9,90 EUR. Celle a J+3 est un dernier rappel.
 *
 * Simple + fiable :
 *   - Reutilise broadcastBtpProject({ relanceKind }) -> MEME ciblage exact
 *     (categorie + rayon Haversine + pro inscrit + pas en pause), seul le texte
 *     de l'email change. Zero duplication de logique.
 *   - Une COLONNE PAR RELANCE : un pro ne peut jamais recevoir deux fois le
 *     meme message, et la relance J+1 ne bloque pas la J+3.
 *   - Fenetres bornees, donc robuste si le cron saute un jour :
 *       J+1 : broadcasted_at dans [J-3 ; J-1]
 *       J+3 : broadcasted_at dans [J-14 ; J-3]
 *     Elles ne se chevauchent pas : un projet passe par les deux, jamais deux
 *     fois par la meme.
 *
 * Selection commune : vertical='btp', status != 'deleted', broadcast_count > 0
 *   (= a bien ete diffuse ; les jamais-diffuses sont geres par broadcast-rescue).
 *
 * Auth : Bearer CRON_SECRET.
 * Test : GET ...?dry=1  -> liste ce qui SERAIT relance, sans rien envoyer.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { broadcastBtpProject } from "@/lib/email/broadcast-btp-project";

export const maxDuration = 300;

const MAX_PER_RUN = 100; // garde-fou anti-flood (au cas où un gros backlog)

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: Request) {
  // 1. AUTH (le mode dry reste protégé : on ne veut pas exposer la liste des projets)
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = new URL(req.url).searchParams.get("dry") === "1";
  const sb = getServiceClient();
  const now = Date.now();
  const SELECT =
    "id, description, category_id, city_id, budget, urgency, suspicion_score, broadcasted_at, broadcast_count";

  const iso = (jours: number) => new Date(now - jours * 86400e3).toISOString();

  // 2. Deux fenetres DISJOINTES : un projet passe par J+1 puis par J+3,
  //    jamais deux fois par la meme (colonne d'idempotence dediee).
  const fenetres = [
    { kind: "j1" as const, colonne: "relance_j1_sent_at", plusRecentQue: iso(3), plusAncienQue: iso(1) },
    { kind: "j3" as const, colonne: "relance_sent_at", plusRecentQue: iso(14), plusAncienQue: iso(3) },
  ];

  type Cible = {
    id: number; description: string | null; category_id: number; city_id: number;
    budget: string | null; urgency: string | null; suspicion_score: number | null;
    broadcasted_at: string | null; broadcast_count: number | null;
    kind: "j1" | "j3";
  };
  const cibles: Cible[] = [];

  for (const f of fenetres) {
    const { data, error } = await sb
      .from("projects")
      .select(SELECT)
      .eq("vertical", "btp")
      .neq("status", "deleted")
      .gt("broadcast_count", 0)
      .is(f.colonne, null)
      .lte("broadcasted_at", f.plusAncienQue)
      .gte("broadcasted_at", f.plusRecentQue)
      .order("broadcasted_at", { ascending: true })
      .limit(MAX_PER_RUN);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    for (const p of (data || []) as Omit<Cible, "kind">[]) cibles.push({ ...p, kind: f.kind });
  }

  const projects = cibles.slice(0, MAX_PER_RUN);

  if (!projects.length) {
    return NextResponse.json({ ok: true, message: "Aucun projet à relancer", relanced: 0, dryRun });
  }

  // Mode test : on liste sans envoyer
  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      wouldRelance: projects.length,
      parRelance: {
        j1: projects.filter((p) => p.kind === "j1").length,
        j3: projects.filter((p) => p.kind === "j3").length,
      },
      projects: projects.map((p) => ({
        id: p.id,
        relance: p.kind,
        category_id: p.category_id,
        city_id: p.city_id,
        broadcasted_at: p.broadcasted_at,
        first_broadcast_count: p.broadcast_count,
      })),
    });
  }

  // 3. Relance un par un (réutilise le broadcast existant en mode relance)
  const results: Array<{ id: number; kind?: "j1" | "j3"; sent: number; total: number; error?: string }> = [];
  for (const p of projects) {
    try {
      const [{ data: cat }, { data: cit }] = await Promise.all([
        sb.from("categories").select("id, name").eq("id", p.category_id).single(),
        sb.from("cities").select("id, name, department_id").eq("id", p.city_id).single(),
      ]);
      if (!cat || !cit) {
        results.push({ id: p.id, sent: 0, total: 0, error: "cat ou ville introuvable" });
        continue;
      }
      const r = await broadcastBtpProject({
        projectId: p.id,
        projectTitle: p.description?.split("\n")[0].slice(0, 100) || "Projet",
        projectDescription: p.description || "",
        projectBudget: p.budget || null,
        projectTimeline: p.urgency || null,
        projectCategoryName: cat.name,
        projectCategoryId: cat.id,
        projectCityName: cit.name,
        projectCityId: cit.id,
        projectDepartmentId: cit.department_id,
        isSuspicious: (p.suspicion_score ?? 0) >= 50,
        relanceKind: p.kind,
      });
      results.push({ id: p.id, kind: p.kind, sent: r.sent, total: r.totalTargets });
    } catch (e) {
      results.push({ id: p.id, sent: 0, total: 0, error: (e as Error).message });
    }
    // Anti-rate-limit Resend (comme broadcast-rescue)
    await new Promise((r) => setTimeout(r, 1500));
  }

  const totalSent = results.reduce((s, r) => s + r.sent, 0);
  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    projects_relanced: results.length,
    total_emails_sent: totalSent,
    results,
  });
}
