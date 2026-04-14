import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

type PdfData = {
  proName: string;
  slug: string;
};

const CORAL = rgb(255 / 255, 90 / 255, 54 / 255);
const BLACK = rgb(10 / 255, 10 / 255, 10 / 255);
const GRAY = rgb(107 / 255, 114 / 255, 128 / 255);
const LIGHT_GRAY = rgb(229 / 255, 231 / 255, 235 / 255);
const WHITE = rgb(1, 1, 1);

const PAGE_WIDTH = 595; // A4
const PAGE_HEIGHT = 842;
const MARGIN = 50;

const BASE_URL = "https://workwave.fr";

/**
 * Genere un PDF d'onboarding personnalise pour un pro.
 * Retourne un Uint8Array (pas de stockage, genere a la volee).
 */
export async function generateOnboardingPdf(
  data: PdfData
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const footer = "Workwave SAS \u00B7 3 rue des Rosiers, 86110 Craon";

  // ============================================
  // Page 1 — Couverture
  // ============================================
  const page1 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  // Barre coral en haut
  page1.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 100,
    width: PAGE_WIDTH,
    height: 100,
    color: CORAL,
  });

  // Logo WORKWAVE dans la barre
  page1.drawText("WORKWAVE", {
    x: MARGIN,
    y: PAGE_HEIGHT - 65,
    size: 32,
    font: helveticaBold,
    color: WHITE,
  });

  // Titre
  page1.drawText("Guide de d\u00E9marrage", {
    x: MARGIN,
    y: PAGE_HEIGHT - 180,
    size: 26,
    font: helveticaBold,
    color: BLACK,
  });

  // Sous-titre personnalise
  page1.drawText(`Bienvenue ${data.proName}`, {
    x: MARGIN,
    y: PAGE_HEIGHT - 230,
    size: 20,
    font: helvetica,
    color: BLACK,
  });

  // Lien fiche
  page1.drawText("Votre fiche est d\u00E9j\u00E0 en ligne sur :", {
    x: MARGIN,
    y: PAGE_HEIGHT - 290,
    size: 14,
    font: helvetica,
    color: GRAY,
  });

  page1.drawText(`${BASE_URL}/artisan/${data.slug}`, {
    x: MARGIN,
    y: PAGE_HEIGHT - 312,
    size: 14,
    font: helveticaBold,
    color: CORAL,
  });

  // Footer
  page1.drawText(footer, {
    x: MARGIN,
    y: 30,
    size: 10,
    font: helvetica,
    color: GRAY,
  });

  // ============================================
  // Page 2 — Reclamer en 3 etapes
  // ============================================
  const page2 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  page2.drawText("R\u00E9clamez votre fiche en 3 \u00E9tapes", {
    x: MARGIN,
    y: PAGE_HEIGHT - 70,
    size: 24,
    font: helveticaBold,
    color: BLACK,
  });

  // Ligne separateur
  page2.drawLine({
    start: { x: MARGIN, y: PAGE_HEIGHT - 85 },
    end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 85 },
    thickness: 1,
    color: LIGHT_GRAY,
  });

  const steps = [
    {
      num: "1",
      title: "Rendez-vous sur votre page de r\u00E9clamation",
      desc: `${BASE_URL}/pro/reclamer/${data.slug}`,
    },
    {
      num: "2",
      title: "V\u00E9rifiez votre identit\u00E9",
      desc: "Saisissez votre SIRET et confirmez votre email professionnel.",
    },
    {
      num: "3",
      title: "Compl\u00E9tez votre profil",
      desc: "Ajoutez description, photos de r\u00E9alisations, certifications et horaires.",
    },
  ];

  let yPos = PAGE_HEIGHT - 140;

  for (const step of steps) {
    // Cercle avec numero
    page2.drawRectangle({
      x: MARGIN,
      y: yPos - 8,
      width: 32,
      height: 32,
      color: CORAL,
      borderColor: CORAL,
      borderWidth: 0,
    });
    page2.drawText(step.num, {
      x: MARGIN + 11,
      y: yPos,
      size: 18,
      font: helveticaBold,
      color: WHITE,
    });

    // Titre de l'etape
    page2.drawText(step.title, {
      x: MARGIN + 48,
      y: yPos + 4,
      size: 16,
      font: helveticaBold,
      color: BLACK,
    });

    // Description
    page2.drawText(step.desc, {
      x: MARGIN + 48,
      y: yPos - 20,
      size: 12,
      font: helvetica,
      color: GRAY,
    });

    yPos -= 90;
  }

  // Message final
  page2.drawText("C'est gratuit et \u00E7a prend 3 minutes.", {
    x: MARGIN,
    y: yPos - 20,
    size: 16,
    font: helveticaBold,
    color: CORAL,
  });

  // Footer
  page2.drawText(footer, {
    x: MARGIN,
    y: 30,
    size: 10,
    font: helvetica,
    color: GRAY,
  });

  // ============================================
  // Page 3 — Comparatif gratuit vs Pro
  // ============================================
  const page3 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  page3.drawText("Pourquoi passer \u00E0 Workwave Pro ?", {
    x: MARGIN,
    y: PAGE_HEIGHT - 70,
    size: 24,
    font: helveticaBold,
    color: BLACK,
  });

  page3.drawLine({
    start: { x: MARGIN, y: PAGE_HEIGHT - 85 },
    end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 85 },
    thickness: 1,
    color: LIGHT_GRAY,
  });

  // En-tetes du tableau
  const colLeft = MARGIN;
  const colRight = PAGE_WIDTH / 2 + 20;
  let tableY = PAGE_HEIGHT - 130;

  page3.drawText("GRATUIT", {
    x: colLeft,
    y: tableY,
    size: 14,
    font: helveticaBold,
    color: GRAY,
  });

  page3.drawText("PRO \u2014 39\u20AC/mois", {
    x: colRight,
    y: tableY,
    size: 14,
    font: helveticaBold,
    color: CORAL,
  });

  tableY -= 10;
  page3.drawLine({
    start: { x: MARGIN, y: tableY },
    end: { x: PAGE_WIDTH - MARGIN, y: tableY },
    thickness: 1,
    color: LIGHT_GRAY,
  });

  const rows = [
    { left: "\u2713 Fiche visible dans l'annuaire", right: "\u2713 Fiche visible dans l'annuaire" },
    { left: "\u2713 Description personnalisable", right: "\u2713 Description personnalisable" },
    { left: "\u2713 Photos de r\u00E9alisations", right: "\u2713 Photos de r\u00E9alisations" },
    { left: "", right: "\u2713 Leads clients qualifi\u00E9s" },
    { left: "", right: "\u2713 Routing IA automatique" },
    { left: "", right: "\u2713 Notifications en temps r\u00E9el" },
    { left: "", right: "\u2713 Dashboard et statistiques" },
    { left: "", right: "\u2713 14 jours d'essai gratuit" },
    { left: "", right: "\u2713 Sans engagement" },
  ];

  tableY -= 30;
  for (const row of rows) {
    if (row.left) {
      page3.drawText(row.left, {
        x: colLeft,
        y: tableY,
        size: 12,
        font: helvetica,
        color: BLACK,
      });
    }
    page3.drawText(row.right, {
      x: colRight,
      y: tableY,
      size: 12,
      font: helvetica,
      color: row.left ? BLACK : CORAL,
    });
    tableY -= 26;
  }

  // Ligne separateur vertical
  const midX = PAGE_WIDTH / 2 + 5;
  page3.drawLine({
    start: { x: midX, y: PAGE_HEIGHT - 120 },
    end: { x: midX, y: tableY + 10 },
    thickness: 1,
    color: LIGHT_GRAY,
  });

  // Comparatif concurrents
  tableY -= 30;
  page3.drawText("vs Habitatpresto : 100-150\u20AC/mois", {
    x: MARGIN,
    y: tableY,
    size: 13,
    font: helvetica,
    color: GRAY,
  });

  tableY -= 22;
  page3.drawText("vs PagesJaunes : 200+\u20AC/mois", {
    x: MARGIN,
    y: tableY,
    size: 13,
    font: helvetica,
    color: GRAY,
  });

  // CTA
  tableY -= 50;
  page3.drawText("Activez votre essai gratuit sur", {
    x: MARGIN,
    y: tableY,
    size: 16,
    font: helvetica,
    color: BLACK,
  });
  page3.drawText(`${BASE_URL}/pro/tarifs`, {
    x: MARGIN,
    y: tableY - 24,
    size: 16,
    font: helveticaBold,
    color: CORAL,
  });

  // Footer
  page3.drawText(footer, {
    x: MARGIN,
    y: 30,
    size: 10,
    font: helvetica,
    color: GRAY,
  });

  return doc.save();
}
