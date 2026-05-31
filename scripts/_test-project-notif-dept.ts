/**
 * Dry-run : envoie un email "Nouveau projet déposé" de TEST vers ADMIN_EMAIL
 * pour vérifier visuellement l'ajout de la ligne "Département" dans le brief admin.
 *
 * projectId factice (999999) -> trackAdminNotification update 0 ligne, aucune
 * donnée de prod modifiée. Le lien "Voir dans le dashboard" pointera vers un
 * projet inexistant (normal pour un test).
 *
 * Usage : npx tsx scripts/_test-project-notif-dept.ts
 */
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

async function main() {
  const { sendProjectNotification } = await import(
    "@/lib/email/send-project-notification"
  );
  console.log(
    "ADMIN_EMAIL:",
    process.env.ADMIN_EMAIL,
    "| RESEND_API_KEY présent:",
    !!process.env.RESEND_API_KEY
  );
  await sendProjectNotification({
    firstName: "TEST Claude (verif departement)",
    email: "test@example.com",
    phone: "0600000000",
    categoryName: "Couvreur",
    cityName: "Dienné",
    departmentName: "Vienne (86)",
    description:
      "EMAIL DE TEST — vérification de l'ajout du département dans le brief admin. À ignorer.",
    urgency: "today",
    budget: "unknown",
    aiQualification: null,
    projectId: 999999,
    isSuspicious: false,
  });
  console.log(
    "✅ Email de test envoyé à ADMIN_EMAIL (projectId factice 999999 → aucune donnée modifiée)."
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
