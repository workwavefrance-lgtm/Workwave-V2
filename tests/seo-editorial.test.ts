import assert from "node:assert/strict";
import test from "node:test";
import { blogSearchTitle, synchronizeListingCount } from "../lib/seo/editorial";
import { debarrasContent } from "../lib/seo/debarras-content";
import { BLOG_PRICE_REDIRECTS, REDIRECTED_BLOG_PATHS } from "../lib/seo/content-redirects";

test("le titre garde le métier, la ville et l'année sans le suffixe de marque", () => {
  assert.equal(blogSearchTitle("Charpentier à Bordeaux : le guide complet pour bien choisir votre artisan en 2026 | Workwave.fr"), "Charpentier à Bordeaux : conseils et devis 2026");
  assert.equal(blogSearchTitle("Prix d'un maçon : 50 € ou 80 € à Poitiers ?"), "Prix d'un maçon : 50 € ou 80 € à Poitiers ?");
});

test("le compte éditorial suit le listing sans modifier prix, surfaces ou dates", () => {
  const text = "Avec 95 professionnels référencés sur la zone, comparez. Prix 95 € pour 27 m² en 2026.";
  assert.equal(synchronizeListingCount(text, 27), "Avec 27 professionnels référencés sur la zone, comparez. Prix 95 € pour 27 m² en 2026.");
  assert.match(synchronizeListingCount(text, 1), /^Avec 1 professionnel référencé/);
});

test("le contenu débarras décrit la prestation sans fiscalité ou disponibilité promises", () => {
  const content = debarrasContent("à Branges", 1);
  const text = JSON.stringify(content);
  assert.match(text, /1 entreprise de débarras à Branges/);
  assert.match(text, /volume/i);
  assert.match(text, /évacuation/);
  assert.doesNotMatch(text, /CESU|50%|hebdomadaire|dans l'heure|gratuit en 30 secondes/);
  assert.equal(content.priceSchema, undefined);
  assert.ok(content.sections.every((section) => section.h2 && section.paragraphs.length));
});

test("seuls les articles déjà redirigés quittent le sitemap, sans supprimer leurs destinations", () => {
  assert.equal(BLOG_PRICE_REDIRECTS.length, 19);
  assert.equal(REDIRECTED_BLOG_PATHS.size, 19);
  for (const entry of BLOG_PRICE_REDIRECTS) {
    assert.equal(entry.permanent, true);
    assert.ok(entry.source.startsWith("/blog/"));
    assert.ok(entry.destination.startsWith("/") && !entry.destination.startsWith("//"));
    assert.ok(!REDIRECTED_BLOG_PATHS.has(entry.destination));
  }
  assert.equal(REDIRECTED_BLOG_PATHS.has("/blog/comment-trouver-un-bon-charpentier-a-mont-de-marsan-landes"), false);
});
