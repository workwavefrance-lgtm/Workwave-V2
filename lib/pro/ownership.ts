export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export function ownsPro(userId: string | null | undefined, claimedBy: string | null | undefined): boolean {
  return !!userId && !!claimedBy && userId === claimedBy;
}

export function deletionAttemptMatches(
  attempt: { target_pro_id: number | null; siret: string | null; email: string | null; type: string | null },
  pro: { id: number; siret: string | null; claimed_by_user_id: string | null },
  user: { id: string; email?: string } | null,
): boolean {
  return !!user && attempt.type === "deletion" && !!pro.siret && attempt.siret === pro.siret
    && attempt.target_pro_id === pro.id
    && ownsPro(user.id, pro.claimed_by_user_id) && !!normalizeEmail(user.email)
    && normalizeEmail(attempt.email) === normalizeEmail(user.email);
}
