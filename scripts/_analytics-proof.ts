import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
(async () => {
  const { getAdminAnalytics } = await import("@/lib/queries/admin-events");
  for (const days of [30, 90]) {
    const a = await getAdminAnalytics(days);
    const b = a.all;
    const k = b.kpis;
    console.log(`\n════ Période ${days}j (all) · ${b.totalEvents} events ════`);
    console.log("KPIs (courant → préc):");
    console.log(`  Revenu        ${(k.revenueCents.current/100).toFixed(2)}€ ← ${(k.revenueCents.previous/100).toFixed(2)}€  (${k.revenueCents.pct ?? "n/a"}%)`);
    console.log(`  Contacts payés ${k.unlocksPaid.current} ← ${k.unlocksPaid.previous}`);
    console.log(`  Offerts        ${k.unlocksFree.current} ← ${k.unlocksFree.previous}`);
    console.log(`  Projets soumis ${k.projectsSubmitted.current} ← ${k.projectsSubmitted.previous}`);
    console.log(`  Form démarré   ${k.formStarted.current} ← ${k.formStarted.previous}`);
    console.log(`  Réclam démarr  ${k.claimsStarted.current} / validées ${k.claimsCompleted.current}`);
    console.log(`  Pros actifs    ${k.activePros.current} ← ${k.activePros.previous}`);
    console.log("Entonnoir conversion:", b.conversionFunnel.map(s=>`${s.label}=${s.count}`).join(" → "));
    console.log("Progression form:   ", b.formFunnel.map(s=>`${s.label}=${s.count}`).join(" → "));
    console.log("Top métiers:        ", b.byCategory.slice(0,5).map(x=>`${x.name}(${x.count})`).join(", "));
    console.log("Urgence:            ", b.byUrgency.map(x=>`${x.name}(${x.count})`).join(", "));
    console.log("revenueByDay points:", b.revenueByDay.length, "| eventsByDay points:", b.eventsByDay.length);
    console.log("Split BTP/IA events:", a.btp.totalEvents, "/", a.ai.totalEvents);
  }
})().then(()=>process.exit(0)).catch(e=>{console.error("FAIL:",e);process.exit(1)});
