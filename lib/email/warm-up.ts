/**
 * Warm-up progressif du domaine, heures d'envoi, et auto-pause.
 */

// Jours feries fixes en France (mois 0-indexed)
const FIXED_HOLIDAYS: Array<[number, number]> = [
  [0, 1],   // 1er janvier
  [4, 1],   // 1er mai
  [4, 8],   // 8 mai
  [6, 14],  // 14 juillet
  [7, 15],  // 15 aout
  [10, 1],  // 1er novembre
  [10, 11], // 11 novembre
  [11, 25], // 25 decembre
];

/**
 * Calcule la date de Paques pour une annee donnee (algorithme de Meeus).
 */
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

/**
 * Retourne tous les jours feries francais pour une annee.
 */
function getFrenchHolidays(year: number): Date[] {
  const holidays: Date[] = [];

  // Feries fixes
  for (const [month, day] of FIXED_HOLIDAYS) {
    holidays.push(new Date(year, month, day));
  }

  // Feries mobiles (bases sur Paques)
  const easter = getEasterDate(year);
  const easterMs = easter.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  holidays.push(new Date(easterMs + 1 * dayMs));   // Lundi de Paques
  holidays.push(new Date(easterMs + 39 * dayMs));  // Ascension
  holidays.push(new Date(easterMs + 50 * dayMs));  // Lundi de Pentecote

  return holidays;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isHoliday(date: Date): boolean {
  const holidays = getFrenchHolidays(date.getFullYear());
  return holidays.some((h) => isSameDay(h, date));
}

/**
 * Verifie si l'heure actuelle est dans les heures d'envoi autorisees.
 * Heures : 8h-19h Europe/Paris, lundi-vendredi, pas de jour ferie.
 */
export function isBusinessHours(now?: Date): boolean {
  const date = now || new Date();

  // Convertir en heure de Paris
  const parisTime = new Date(
    date.toLocaleString("en-US", { timeZone: "Europe/Paris" })
  );

  const hour = parisTime.getHours();
  const dayOfWeek = parisTime.getDay(); // 0=dimanche, 6=samedi

  // Weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;

  // Hors horaires (avant 8h ou apres 19h)
  if (hour < 8 || hour >= 19) return false;

  // Jour ferie
  if (isHoliday(parisTime)) return false;

  return true;
}

/**
 * Calcule la limite d'envoi quotidienne selon le warm-up progressif.
 * Semaine 1 : 20/jour
 * Semaine 2 : 50/jour
 * Semaine 3 : 100/jour
 * Semaine 4+ : campaign.daily_limit (default 200, max 500)
 */
export function computeDailyLimit(
  campaignCreatedAt: string | Date,
  campaignDailyLimit: number
): number {
  const created = new Date(campaignCreatedAt);
  const now = new Date();
  const daysSinceStart = Math.floor(
    (now.getTime() - created.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (daysSinceStart < 7) return 20;
  if (daysSinceStart < 14) return 50;
  if (daysSinceStart < 21) return 100;
  return Math.min(campaignDailyLimit, 500);
}

/**
 * Calcule le prochain moment d'envoi en jour ouvre, entre 9h et 11h Paris.
 */
export function computeNextBusinessSendTime(
  currentDate: Date,
  daysToAdd: number
): Date {
  const target = new Date(currentDate);
  target.setDate(target.getDate() + daysToAdd);

  // Convertir en heure de Paris pour les calculs
  const parisStr = target.toLocaleString("en-US", {
    timeZone: "Europe/Paris",
  });
  const paris = new Date(parisStr);

  // Decaler si weekend
  while (paris.getDay() === 0 || paris.getDay() === 6 || isHoliday(paris)) {
    paris.setDate(paris.getDate() + 1);
    target.setDate(target.getDate() + 1);
  }

  // Heure random entre 9h00 et 11h00 (en minutes : 540-660)
  const randomMinutes = 540 + Math.floor(Math.random() * 120);
  const hours = Math.floor(randomMinutes / 60);
  const minutes = randomMinutes % 60;

  // Construire la date finale en Europe/Paris
  // On utilise un offset simple : set les heures en UTC decale du fuseau Paris
  const year = paris.getFullYear();
  const month = paris.getMonth();
  const day = paris.getDate();

  // Creer la date en Paris puis convertir en UTC
  const parisTarget = new Date(year, month, day, hours, minutes, 0, 0);

  // Calculer l'offset Paris vs UTC
  const utcStr = parisTarget.toLocaleString("en-US", { timeZone: "UTC" });
  const utcDate = new Date(utcStr);
  const offset = parisTarget.getTime() - utcDate.getTime();

  return new Date(parisTarget.getTime() - offset);
}

/**
 * Verifie les taux de bounce et complaint. Retourne une raison de pause si seuil depasse.
 */
export async function checkAutoPause(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  campaignId: number
): Promise<{ shouldPause: boolean; reason?: string; bounceRate?: number; complaintRate?: number }> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Compter les emails envoyes les 7 derniers jours
  const { count: totalSent } = await supabase
    .from("email_logs")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .gte("sent_at", sevenDaysAgo.toISOString());

  if (!totalSent || totalSent < 50) {
    return { shouldPause: false }; // pas assez de donnees
  }

  // Compter les bounces
  const { count: bounceCount } = await supabase
    .from("email_logs")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("status", "bounced")
    .gte("sent_at", sevenDaysAgo.toISOString());

  // Compter les plaintes spam
  const { count: complaintCount } = await supabase
    .from("email_logs")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("status", "complained")
    .gte("sent_at", sevenDaysAgo.toISOString());

  const bounceRate = (bounceCount || 0) / totalSent;
  const complaintRate = (complaintCount || 0) / totalSent;

  if (complaintRate > 0.003) {
    return {
      shouldPause: true,
      reason: `Complaint rate critique: ${(complaintRate * 100).toFixed(2)}% (seuil: 0.3%)`,
      bounceRate,
      complaintRate,
    };
  }

  if (bounceRate > 0.03) {
    return {
      shouldPause: true,
      reason: `Bounce rate trop eleve: ${(bounceRate * 100).toFixed(2)}% (seuil: 3%)`,
      bounceRate,
      complaintRate,
    };
  }

  return { shouldPause: false, bounceRate, complaintRate };
}
