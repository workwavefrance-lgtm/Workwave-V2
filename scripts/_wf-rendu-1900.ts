import { titreFicheOuverte, descriptionFicheOuverte, dateEnToutesLettres } from "../lib/seo/pro-registre";
import { formatAgeYears, formatDateCreation, formatFoundingYear } from "../lib/utils/sirene";

const f = {
  nom: "SECOURS CATHOLIQUE",
  metierSingulier: "spécialiste de l'aide administrative",
  ville: "Valenciennes",
  codePostal: "59300",
  pays: "FR",
  dateCreation: "1900-01-01",
  formeJuridiqueCode: "9220",
};
console.log("TITRE  :", titreFicheOuverte(f, "Aide administrative", null));
console.log("DESC   :", descriptionFicheOuverte(f));
console.log("carte  :", `Entreprise créée le ${formatDateCreation("1900-01-01")} · ${formatAgeYears("1900-01-01")} ans d'activité`);
console.log("annee  :", formatFoundingYear("1900-01-01"), "| lettres :", dateEnToutesLettres("1900-01-01"));
