import { createHmac } from "crypto";

export function generateResetToken(email: string, timestamp: number): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const payload = `password-reset:${email}:${timestamp}`;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyResetToken(
  email: string,
  timestamp: number,
  token: string
): boolean {
  // Vérifier expiration (15 minutes)
  if (Date.now() - timestamp > 15 * 60 * 1000) return false;
  const expected = generateResetToken(email, timestamp);
  return token === expected;
}
