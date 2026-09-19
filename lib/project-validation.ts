import { z } from "zod";

export const projectSchema = z.object({
  firstName: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  phone: z
    .string()
    .refine(
      value => /^(?:0[1-9]\d{7,8}|\+33[1-9]\d{8}|\+32[1-9]\d{7,8})$/.test(value.replace(/[\s.-]/g, "")),
      "Numéro de téléphone invalide"
    ),
  // Liste complete des metiers choisis, « 3,1,2 » (le premier est le
  // principal, deja porte par categoryId). Optionnel : un formulaire qui
  // n'envoie que categoryId continue de fonctionner a l'identique.
  categoryIds: z.string().optional(),
  categoryId: z.coerce
    .number()
    .int()
    .positive("Veuillez choisir un type de travaux"),
  cityId: z.coerce.number().int().positive("Veuillez choisir une ville"),
  // Description OBLIGATOIRE depuis le 19/08/2026 (demande Willy) : un pro a qui
  // on demande 9,90 EUR pour un contact doit pouvoir juger sur piece. Deux
  // projets deposes le 18/08 (Chateauroux, Mevoisins) n'avaient pas une ligne.
  //
  // L'echec silencieux de l'ancienne version est evite AUTREMENT : le bouton
  // "Continuer" de l'etape 2 est desormais bloque tant que le champ n'est pas
  // rempli, donc l'utilisateur ne peut plus atteindre l'envoi avec un champ
  // vide. Cette regle serveur n'est plus que le filet de securite.
  //
  // A SURVEILLER : le tunnel etait a 18 % de completion (758 formulaires
  // ouverts pour 134 projets soumis). Un champ obligatoire de plus fera
  // abandonner des gens. Si le nombre de projets deposes chute nettement, le
  // seuil de 20 caracteres est le premier levier a baisser.
  description: z
    .string()
    .trim()
    .min(20, "Décrivez votre projet en quelques mots : les artisans en ont besoin pour vous répondre")
    .max(5000, "Description trop longue (5000 caractères max)"),
  urgency: z.enum(["today", "this_week", "this_month", "not_urgent"], {
    message: "Veuillez indiquer l'urgence",
  }),
  budget: z.enum(
    ["lt500", "500_2000", "2000_5000", "5000_15000", "gt15000", "unknown"],
    { message: "Veuillez indiquer votre budget" }
  ),
  consent: z.literal("on", {
    message: "Vous devez accepter la transmission de vos données",
  }),
  // Honeypot : doit rester vide
  website: z.string().max(0).optional(),
});
