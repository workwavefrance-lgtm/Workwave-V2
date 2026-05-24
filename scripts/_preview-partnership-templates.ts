/**
 * Envoie les 5 templates de pitch partenariat a workwave.france@gmail.com
 * pour validation visuelle. N'utilise PAS la base : juste des partnerships
 * fictifs construits en memoire.
 *
 * Exec : npx tsx scripts/_preview-partnership-templates.ts
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const TEST_EMAIL = "workwave.france@gmail.com";

// Imports normaux (top-level await pas supporte par tsx CJS)
import { Resend } from "resend";
import { PARTNERSHIP_TEMPLATES } from "../lib/email/partnerships-templates";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const samplePartnerships: any[] = [
  {
    type: "mairie",
    name: "Mairie de Poitiers",
    organization: "Ville de Poitiers",
    contact_first_name: null,
    contact_last_name: null,
    contact_role: "Maire",
    contact_email: TEST_EMAIL,
    contact_phone: "05 49 52 35 35",
    website: "https://www.poitiers.fr",
    postal_code: "86000",
    city: "Poitiers",
    department_code: "86",
    status: "to_contact",
    first_contacted_at: null,
    last_contacted_at: null,
    responded_at: null,
    partnership_active_since: null,
    emails_sent_count: 0,
    notes: null,
    response_summary: null,
    backlink_url: null,
    backlink_observed_at: null,
    id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    type: "office_tourisme",
    name: "Office de tourisme Grand Poitiers",
    contact_email: TEST_EMAIL,
    city: "Poitiers",
    postal_code: "86000",
    department_code: "86",
    status: "to_contact",
    emails_sent_count: 0,
    id: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    type: "agence_immo",
    name: "Century 21 Poitiers Centre",
    contact_email: TEST_EMAIL,
    city: "Poitiers",
    postal_code: "86000",
    department_code: "86",
    status: "to_contact",
    emails_sent_count: 0,
    id: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    type: "notaire",
    name: "Maître Dupont — Étude notariale",
    contact_email: TEST_EMAIL,
    contact_last_name: "Dupont",
    city: "Châtellerault",
    postal_code: "86100",
    department_code: "86",
    status: "to_contact",
    emails_sent_count: 0,
    id: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    type: "cci",
    name: "CCI de la Vienne",
    contact_email: TEST_EMAIL,
    city: "Poitiers",
    postal_code: "86000",
    department_code: "86",
    status: "to_contact",
    emails_sent_count: 0,
    id: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
  console.log(`\nEnvoi de 5 templates de preview a ${TEST_EMAIL}...\n`);

  for (const p of samplePartnerships) {
    // Resolution du template par type (logique de defaultTemplateForType)
    let templateKey: string;
    if (p.type === "mairie") templateKey = "mairie";
    else if (p.type === "office_tourisme") templateKey = "office_tourisme";
    else if (p.type === "agence_immo") templateKey = "agence_immo";
    else if (p.type === "notaire") templateKey = "notaire";
    else templateKey = "cci_cma";

    const template = PARTNERSHIP_TEMPLATES[templateKey];
    const subject = template.subject(p);
    const html = template.html(p);
    const text = template.text(p);

    try {
      const result = await resend.emails.send({
        from: "Workwave <contact@workwave.fr>",
        to: TEST_EMAIL,
        replyTo: "contact@workwave.fr",
        subject: `[PREVIEW ${p.type.toUpperCase()}] ${subject}`,
        html,
        text,
      });
      if (result.error) {
        console.log(`✗ ${p.type} : ${result.error.message}`);
      } else {
        console.log(`✓ ${p.type} envoye (${p.name})`);
      }
    } catch (e) {
      const err = e as Error;
      console.log(`✗ ${p.type} : ${err.message}`);
    }

    // Petite pause pour pas spammer Resend
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n→ Va sur ${TEST_EMAIL} et regarde les 5 mails [PREVIEW ...].`);
  console.log("→ Si quelque chose te plait pas, dis-moi, je rectifie.\n");
}

main().catch(console.error);
