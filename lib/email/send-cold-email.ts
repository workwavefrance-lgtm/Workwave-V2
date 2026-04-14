import { sendBrevoEmail } from "./brevo-client";
import { getEmailTemplate } from "./cold-email-templates";
import { generateOnboardingPdf } from "./generate-onboarding-pdf";
import type { SubjectVariant } from "@/lib/types/database";

type SendColdEmailParams = {
  proId: number;
  proName: string;
  proEmail: string;
  prenomDirigeant: string | null;
  cityName: string;
  slug: string;
  step: number;
  subjectVariant: SubjectVariant;
  dryRun: boolean;
};

type SendColdEmailResult = {
  messageId: string;
  subject: string;
  recipientEmail: string;
};

/**
 * Envoie un cold email a un pro via Brevo.
 * Step 1 inclut le PDF en piece jointe.
 * En dry run, l'email est redirige vers workwave.france@gmail.com.
 */
export async function sendColdEmail(
  params: SendColdEmailParams
): Promise<SendColdEmailResult> {
  const { subject, html } = getEmailTemplate(
    params.step,
    {
      proId: params.proId,
      proName: params.proName,
      proEmail: params.proEmail,
      prenomDirigeant: params.prenomDirigeant,
      cityName: params.cityName,
      slug: params.slug,
    },
    params.subjectVariant
  );

  const recipientEmail = params.dryRun
    ? "workwave.france@gmail.com"
    : params.proEmail;

  // Generer le PDF pour le step 1
  let attachments: { name: string; content: string }[] | undefined;
  if (params.step === 1) {
    try {
      const pdfBytes = await generateOnboardingPdf({
        proName: params.proName,
        slug: params.slug,
      });
      attachments = [
        {
          name: "guide-workwave.pdf",
          content: Buffer.from(pdfBytes).toString("base64"),
        },
      ];
    } catch (error) {
      // Si le PDF echoue, on envoie l'email sans PJ
      console.error("Erreur generation PDF (non bloquante):", error);
    }
  }

  const result = await sendBrevoEmail({
    to: recipientEmail,
    subject,
    htmlContent: html,
    attachments,
  });

  return {
    messageId: result.messageId,
    subject,
    recipientEmail,
  };
}
