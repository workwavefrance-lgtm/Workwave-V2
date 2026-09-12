import assert from "node:assert/strict";
import test from "node:test";
import { createBtpCategoryRules, type ProCategories } from "../lib/matching/btp-categories";

// IDs volontairement arbitraires : aucune règle ne doit dépendre des IDs prod.
const categories = [
  { id: 71, slug: "plombier", vertical: "btp" },
  { id: 18, slug: "chauffagiste", vertical: "btp" },
  { id: 302, slug: "climaticien", vertical: "btp" },
  { id: 44, slug: "peintre", vertical: "btp" },
  { id: 92, slug: "multiservice", vertical: "btp" },
  { id: 150, slug: "petit-bricolage", vertical: "domicile" },
  { id: 401, slug: "aide-seniors", vertical: "personne" },
  { id: 600, slug: "developpeur-web", vertical: "tech" },
];
const rules = createBtpCategoryRules(categories);
const ids = (pro: ProCategories) => rules.projectCategoryIdsForPro(pro).sort((a, b) => a - b);

test("un chauffagiste voit les projets plomberie/climatisation annoncés par email", () => {
  assert.deepEqual(ids({ category_id: 18 }), [18, 71, 302]);
  assert.deepEqual(ids({ category_id: 71 }), [18, 71, 302]);
  assert.deepEqual(ids({ category_id: 302 }), [18, 71, 302]);
});

test("un métier secondaire CVC étend le même cluster, sans doublons", () => {
  assert.deepEqual(ids({ category_id: 44, secondary_category_ids: [71, 302, 71] }), [18, 44, 71, 302]);
});

test("multiservice secondaire ne rend pas une aide à domicile généraliste BTP", () => {
  assert.deepEqual(ids({ category_id: 401, secondary_category_ids: [92, 150] }), [92, 150, 401]);
});

test("généraliste principal reçoit BTP et ses propres métiers, pas tout domicile/personne/tech", () => {
  assert.deepEqual(ids({ category_id: 150 }), [18, 44, 71, 92, 150, 302]);
  assert.deepEqual(ids({ category_id: 92, secondary_category_ids: [401] }), [18, 44, 71, 92, 302, 401]);
});

test("le filtre SQL email et la liste dashboard/welcome correspondent pour chaque profil/métier", () => {
  // Interprète les deux opérateurs PostgREST réellement utilisés par le filtre,
  // puis confronte les deux directions du matching sur une matrice de profils.
  function matchesSql(filter: string, pro: ProCategories) {
    return filter.split(",").some((clause) => {
      const primary = /^category_id\.eq\.(\d+)$/.exec(clause);
      if (primary) return pro.category_id === Number(primary[1]);
      const secondary = /^secondary_category_ids\.cs\.\{(\d+)\}$/.exec(clause);
      assert.ok(secondary, `opérateur non testé : ${clause}`);
      return (pro.secondary_category_ids ?? []).includes(Number(secondary[1]));
    });
  }
  for (const primary of categories) {
    for (const secondary of [null, ...categories.map((c) => [c.id])]) {
      const pro = { category_id: primary.id, secondary_category_ids: secondary };
      for (const project of categories) {
        assert.equal(
          matchesSql(rules.proCategoryFilterForProject(project.id), pro),
          rules.projectCategoryIdsForPro(pro).includes(project.id),
          `${primary.slug}, secondaire=${secondary} → ${project.slug}`
        );
      }
    }
  }
});

test("un catalogue incomplet conserve le métier connu et ne fabrique pas d'IDs", () => {
  const partial = createBtpCategoryRules(categories.filter((c) => c.slug !== "climaticien"));
  assert.deepEqual(partial.projectCategoryIdsForPro({ category_id: 18 }).sort((a, b) => a - b), [18, 71]);
  assert.deepEqual(partial.projectCategoryIdsForPro({ category_id: 999 }), [999]);
});
