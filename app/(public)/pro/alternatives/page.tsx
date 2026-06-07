import { permanentRedirect } from "next/navigation";

// /pro/alternatives (sans concurrent) → page pilier qui liste les comparatifs.
export default function AlternativesIndex() {
  permanentRedirect("/pro/sans-abonnement");
}
