import assert from "node:assert/strict";
import test from "node:test";
import { toLeadDetailData } from "../lib/pro/lead-detail-data";

const lead = {
  id: 9, status: "sent" as const, sent_at: "2026-09-12", contacted_at: null,
  internal_note: "secret interne",
  project: {
    id: 4, first_name: "Exemple", email: "client@example.com", phone: "0612345678",
    description: "Travaux à prévoir, client@example.com", urgency: "this_month" as const,
    budget: "unknown" as const, ai_qualification: null,
    deletion_token: "SECRET_RETRAIT", future_private_field: "FUTUR_SECRET",
    category: { name: "Plombier", internal: "INTERNE_CATEGORIE" },
    city: { name: "Poitiers", private: "VILLE_PRIVEE", department: { code: "86" } },
  },
};

for (const unlocked of [false, true]) {
  test(`les champs privés sont absents après sérialisation, débloqué=${unlocked}`, () => {
    const result = toLeadDetailData(lead, unlocked);
    const serialized = JSON.stringify(result);
    for (const secret of ["deletion_token", "SECRET_RETRAIT", "FUTUR_SECRET", "secret interne", "INTERNE_CATEGORIE", "VILLE_PRIVEE"]) {
      assert.equal(serialized.includes(secret), false, secret);
    }
    assert.equal(result.project.email, unlocked ? lead.project.email : "");
    assert.equal(result.project.phone, unlocked ? lead.project.phone : "");
    assert.equal(result.project.description.includes("client@example.com"), unlocked);
  });
}

test("une description marquée sensible sans version nettoyée reste masquée", () => {
  const result = toLeadDetailData({ ...lead, project: { ...lead.project, has_contact_in_description: true, cleaned_description: null } }, false);
  assert.equal(result.project.description, "");
});
