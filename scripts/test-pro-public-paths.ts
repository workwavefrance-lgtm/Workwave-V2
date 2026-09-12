import assert from "node:assert/strict";
import { getProPublicPagePaths } from "../lib/pro/public-page-paths";
import { getParentListingCitySlugs } from "../lib/queries/cities";

const paths = getProPublicPagePaths("atelier", [
  { categorySlug: "plombier", locationSlug: "paris-1er-arrondissement", count: 11, specialtyCount: 11 },
  { categorySlug: "plombier", locationSlug: "paris", count: 31, specialtyCount: 0 },
  { categorySlug: "plombier", locationSlug: "paris-75", count: 51 },
]);
assert(paths.includes("/artisan/atelier"));
assert(paths.includes("/plombier/paris-1er-arrondissement/page/2"));
assert(!paths.includes("/plombier/paris-1er-arrondissement/page/3"));
assert(paths.includes("/plombier/paris/page/3"));
assert(paths.includes("/plombier/paris-75/page/4"));
assert(paths.includes("/plombier/depannage/paris-1er-arrondissement/page/2"));
assert(paths.includes("/plombier/depannage/paris"));
assert(!paths.includes("/plombier/depannage/paris/page/2"), "Une sous-spécialité n'agrège pas les arrondissements");
assert(!paths.some((path) => path.includes("depannage/paris-75")), "Pas de sous-spécialité départementale inexistante");
assert(!paths.some((path) => /[\[\]]/.test(path)), "Aucun pattern invalidant tout l'annuaire");
assert.equal(paths.length, new Set(paths).size);
const capped = getProPublicPagePaths("atelier", [{ categorySlug: "menage", locationSlug: "vienne-86", count: 1000000 }]);
assert(capped.includes("/menage/vienne-86/page/500"));
assert(!capped.includes("/menage/vienne-86/page/501"));
assert.deepEqual(getParentListingCitySlugs({ name: "Paris 1er Arrondissement", slug: "paris-1er-arrondissement" }), ["paris"]);
assert.deepEqual(getParentListingCitySlugs({ name: "Marseille 16e Arrondissement", slug: "marseille-16e" }), ["marseille"]);
assert.deepEqual(getParentListingCitySlugs({ name: "Beausoleil", slug: "beausoleil" }), ["monaco"]);
assert.deepEqual(getParentListingCitySlugs({ name: "Poitiers", slug: "poitiers" }), []);
console.log("Invalidation ciblée OK : ville, arrondissement, métropole, département, sous-spécialités, pagination bornée, aucun réseau.");
