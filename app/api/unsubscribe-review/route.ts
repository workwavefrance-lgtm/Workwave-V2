/**
 * Endpoint One-Click unsubscribe RFC 8058.
 *
 * Gmail / Outlook / Yahoo declenchent un POST sur cette URL quand
 * l'user clique le bouton "Se desinscrire" affiche directement dans
 * leur interface (separe du lien HTML dans le mail). Boost massif du
 * delivery (Gmail penalise les expediteurs sans one-click).
 *
 * Format attendu :
 *   POST /api/unsubscribe-review?token=X&email=Y
 *   Content-Type: application/x-www-form-urlencoded
 *   Body: List-Unsubscribe=One-Click
 *
 * On accepte aussi GET pour le fallback (lien dans le mail).
 */
import { NextRequest, NextResponse } from "next/server";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { verifyReviewUnsubscribeToken } from "@/lib/utils/review-unsubscribe-token";

async function handle(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");

  if (!token || !email) {
    return NextResponse.json(
      { error: "Lien invalide ou incomplet." },
      { status: 400 }
    );
  }

  if (!verifyReviewUnsubscribeToken(email, token)) {
    return NextResponse.json(
      { error: "Lien invalide ou expiré." },
      { status: 400 }
    );
  }

  const sb = getAdminServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (sb.from("review_unsubscribes") as any).upsert(
    {
      email: email.toLowerCase().trim(),
      source: "email_link",
    },
    { onConflict: "email", ignoreDuplicates: true }
  );

  if (error) {
    console.error("[api/unsubscribe-review] Erreur upsert :", error.message);
    return NextResponse.json(
      { error: "Erreur lors de la désinscription." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
